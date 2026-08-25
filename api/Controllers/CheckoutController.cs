using System.Security.Claims;
using api.Data;
using api.DTOs;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;

namespace api.Controllers;

[ApiController]
[Route("api/checkout")]
[Authorize]
public class CheckoutController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    public CheckoutController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    private bool StripeConfigured =>
        _config["Stripe:SecretKey"] is { } k && k.StartsWith("sk_test_") && !k.Contains("REPLACE_ME");

    /// <summary>Crée une commande Pending depuis le panier puis une session Stripe test
    /// (ou simule le paiement si Stripe n'est pas configuré — mode démo).</summary>
    [HttpPost]
    public async Task<ActionResult<CheckoutResponseDto>> Create()
    {
        var cart = await _db.Carts
            .Include(c => c.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == UserId);

        if (cart is null || cart.Items.Count == 0)
            return BadRequest(new { message = "Panier vide." });

        foreach (var item in cart.Items)
        {
            if (item.Product is null) return BadRequest(new { message = "Produit invalide dans le panier." });
            if (item.Quantity > item.Product.Stock)
                return BadRequest(new { message = $"Stock insuffisant pour {item.Product.Name}." });
        }

        // Idempotence : une commande Pending abandonnée d'un essai de checkout précédent ne doit pas
        // rester confirmable en parallèle de la nouvelle (sinon double décrément de stock possible).
        var stalePending = await _db.Orders
            .Where(o => o.UserId == UserId && o.Status == OrderStatus.Pending)
            .ToListAsync();
        if (stalePending.Count > 0) _db.Orders.RemoveRange(stalePending);

        var order = new Order
        {
            UserId = UserId,
            Status = OrderStatus.Pending,
            TotalPrice = cart.Items.Sum(i => i.Product!.Price * i.Quantity),
            Items = cart.Items.Select(i => new OrderItem
            {
                ProductId = i.ProductId,
                UnitPrice = i.Product!.Price,
                Quantity = i.Quantity
            }).ToList()
        };
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        if (!StripeConfigured)
        {
            // Mode démo : paiement simulé immédiat (Stripe test non configuré).
            if (!await ConfirmOrderInternal(order))
                return Conflict(new { message = "Stock insuffisant pour finaliser la commande." });
            return Ok(new CheckoutResponseDto { OrderId = order.Id, Simulated = true });
        }

        StripeConfiguration.ApiKey = _config["Stripe:SecretKey"];
        var successUrl = _config["Stripe:SuccessUrl"] ?? "http://localhost:5173/checkout/success";
        var cancelUrl = _config["Stripe:CancelUrl"] ?? "http://localhost:5173/checkout/cancel";

        var options = new SessionCreateOptions
        {
            Mode = "payment",
            SuccessUrl = $"{successUrl}?orderId={order.Id}",
            CancelUrl = $"{cancelUrl}?orderId={order.Id}",
            LineItems = cart.Items.Select(i => new SessionLineItemOptions
            {
                Quantity = i.Quantity,
                PriceData = new SessionLineItemPriceDataOptions
                {
                    Currency = "eur",
                    UnitAmount = (long)Math.Round(i.Product!.Price * 100, MidpointRounding.AwayFromZero),
                    ProductData = new SessionLineItemPriceDataProductDataOptions { Name = i.Product.Name }
                }
            }).ToList(),
            Metadata = new Dictionary<string, string> { ["orderId"] = order.Id.ToString() }
        };

        var session = await new SessionService().CreateAsync(options);
        order.StripeSessionId = session.Id;
        await _db.SaveChangesAsync();

        return Ok(new CheckoutResponseDto { OrderId = order.Id, CheckoutUrl = session.Url });
    }

    /// <summary>Appelé par la page de succès : vérifie le paiement (si Stripe réel), marque la
    /// commande payée, décrémente le stock, vide le panier.</summary>
    [HttpPost("confirm/{orderId:int}")]
    public async Task<IActionResult> Confirm(int orderId)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == UserId);
        if (order is null) return NotFound();
        if (order.Status != OrderStatus.Pending) return Ok(new { status = order.Status.ToString() });

        // En mode Stripe réel, on ne fait JAMAIS confiance à ce seul appel client : on revérifie
        // auprès de Stripe que la session a effectivement été payée avant de livrer quoi que ce soit.
        if (StripeConfigured)
        {
            if (order.StripeSessionId is null)
                return BadRequest(new { message = "Commande sans session de paiement." });

            StripeConfiguration.ApiKey = _config["Stripe:SecretKey"];
            var session = await new SessionService().GetAsync(order.StripeSessionId);
            if (session.PaymentStatus != "paid")
                return BadRequest(new { message = "Paiement non confirmé par Stripe." });
        }

        if (!await ConfirmOrderInternal(order))
            return Conflict(new { message = "Stock insuffisant pour finaliser la commande." });
        return Ok(new { status = order.Status.ToString() });
    }

    /// <summary>Décrémente le stock et marque la commande payée. Revalide le stock à cet instant
    /// (pas seulement à la création) : retourne false et n'écrit rien si un article est en rupture.</summary>
    private async Task<bool> ConfirmOrderInternal(Order order)
    {
        var products = new Dictionary<int, Models.Product>();
        foreach (var item in order.Items)
        {
            var product = await _db.Products.FindAsync(item.ProductId);
            if (product is null || product.Stock < item.Quantity) return false;
            products[item.ProductId] = product;
        }

        foreach (var item in order.Items)
            products[item.ProductId].Stock -= item.Quantity;
        order.Status = OrderStatus.Paid;

        var cart = await _db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == UserId);
        cart?.Items.Clear();

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            // Le stock a changé entre la lecture ci-dessus et l'écriture (autre commande confirmée
            // en parallèle) : on n'écrase pas, on signale un conflit plutôt que de survendre.
            foreach (var entry in _db.ChangeTracker.Entries()) entry.State = EntityState.Detached;
            return false;
        }
        return true;
    }
}
