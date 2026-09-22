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
    private const string SimulationMode = "simulation";
    private const string StripeTestMode = "stripe_test";

    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<CheckoutController> _logger;

    public CheckoutController(
        AppDbContext db,
        IConfiguration config,
        ILogger<CheckoutController> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    private bool SimulationEnabled =>
        string.Equals(_config["Stripe:Mode"], "Simulation", StringComparison.OrdinalIgnoreCase);

    private bool StripeTestEnabled =>
        string.Equals(_config["Stripe:Mode"], "StripeTest", StringComparison.OrdinalIgnoreCase);

    private string? StripeTestKey =>
        _config["Stripe:SecretKey"] is { } key
        && key.StartsWith("sk_test_", StringComparison.Ordinal)
        && !key.Contains("REPLACE_ME", StringComparison.OrdinalIgnoreCase)
            ? key
            : null;

    /// <summary>Crée une commande Pending depuis le panier. Le mode de paiement est une
    /// configuration serveur explicite : simulation locale ou session Stripe de test.</summary>
    [HttpPost]
    public async Task<ActionResult<CheckoutResponseDto>> Create()
    {
        if (!SimulationEnabled && !StripeTestEnabled)
        {
            _logger.LogWarning("Checkout refusé : mode de paiement serveur invalide");
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { message = "Le paiement est temporairement indisponible." });
        }

        if (StripeTestEnabled && StripeTestKey is null)
        {
            _logger.LogWarning("Checkout Stripe test indisponible : configuration incomplète");
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { message = "Le paiement Stripe test est temporairement indisponible." });
        }

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

        // Une session Stripe en attente peut encore être payée hors de l'application : ne jamais
        // supprimer sa commande ni en créer une seconde à partir du même panier. L'utilisateur doit
        // reprendre ou annuler explicitement cette commande avant de recommencer.
        var stalePending = await _db.Orders
            .Where(o => o.UserId == UserId && o.Status == OrderStatus.Pending)
            .ToListAsync();
        if (stalePending.Any(o => o.StripeSessionId is not null))
        {
            _logger.LogWarning("Checkout refusé : une session Stripe test est déjà en attente");
            return Conflict(new
            {
                message = "Un paiement Stripe test est déjà en attente. Reprenez ou annulez cette commande avant de recommencer."
            });
        }

        // Une tentative simulée abandonnée n'a aucun paiement externe associé. On l'annule
        // logiquement plutôt que de la supprimer afin de conserver un historique cohérent et de
        // garantir qu'elle ne pourra plus décrémenter le stock lors d'une confirmation tardive.
        foreach (var pendingOrder in stalePending)
            pendingOrder.Status = OrderStatus.Cancelled;

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

        if (SimulationEnabled)
        {
            // La création ne constitue pas un succès. Même en démo, le client devra appeler
            // l'endpoint confirm : le serveur revalidera propriétaire, statut et stock.
            _logger.LogInformation("Commande de démonstration créée en attente de confirmation serveur");
            return Ok(new CheckoutResponseDto { OrderId = order.Id, PaymentMode = SimulationMode });
        }

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

        try
        {
            var stripeClient = new StripeClient(StripeTestKey!);
            var session = await new SessionService(stripeClient).CreateAsync(options);
            if (string.IsNullOrWhiteSpace(session.Id) || string.IsNullOrWhiteSpace(session.Url))
                throw new StripeException("Stripe n'a pas retourné de session exploitable.");

            order.StripeSessionId = session.Id;
            await _db.SaveChangesAsync();

            _logger.LogInformation("Session Stripe test créée pour une commande en attente");
            return Ok(new CheckoutResponseDto
            {
                OrderId = order.Id,
                CheckoutUrl = session.Url,
                PaymentMode = StripeTestMode
            });
        }
        catch (StripeException ex)
        {
            order.Status = OrderStatus.Cancelled;
            await _db.SaveChangesAsync();
            _logger.LogError("Création de session Stripe test échouée (type {StripeErrorType})",
                ex.StripeError?.Type ?? "inconnu");
            return StatusCode(StatusCodes.Status502BadGateway,
                new { message = "Le service de paiement Stripe test est temporairement indisponible." });
        }
    }

    /// <summary>Appelé par la page de retour : vérifie le paiement (si Stripe test), marque la
    /// commande payée, décrémente le stock, vide le panier.</summary>
    [HttpPost("confirm/{orderId:int}")]
    public async Task<ActionResult<CheckoutConfirmationDto>> Confirm(int orderId)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == UserId);
        if (order is null) return NotFound();

        var paymentMode = order.StripeSessionId is null ? SimulationMode : StripeTestMode;
        if (order.Status is OrderStatus.Paid or OrderStatus.Shipped)
        {
            // Idempotence : un rafraîchissement de la page ne décrémente jamais le stock deux fois.
            return Ok(new CheckoutConfirmationDto
            {
                Status = order.Status.ToString(),
                PaymentMode = paymentMode
            });
        }
        if (order.Status != OrderStatus.Pending)
            return Conflict(new { message = "Cette commande ne peut pas être confirmée dans son statut actuel." });

        // La présence d'une session sur la commande est la source de vérité. Si sa clé n'est
        // plus disponible, on refuse : une commande Stripe ne bascule jamais en simulation.
        if (order.StripeSessionId is not null)
        {
            if (StripeTestKey is null)
            {
                _logger.LogError("Confirmation Stripe test impossible : configuration absente");
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    new { message = "La vérification du paiement Stripe test est temporairement indisponible." });
            }

            try
            {
                var stripeClient = new StripeClient(StripeTestKey);
                var session = await new SessionService(stripeClient).GetAsync(order.StripeSessionId);
                if (!string.Equals(session.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
                    return Conflict(new { message = "Paiement non confirmé par Stripe." });
            }
            catch (StripeException ex)
            {
                _logger.LogError("Vérification Stripe test échouée (type {StripeErrorType})",
                    ex.StripeError?.Type ?? "inconnu");
                return StatusCode(StatusCodes.Status502BadGateway,
                    new { message = "La vérification du paiement Stripe test a temporairement échoué." });
            }
        }
        else if (!SimulationEnabled)
        {
            _logger.LogWarning("Confirmation simulée refusée : mode démonstration désactivé");
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { message = "La confirmation de cette commande est indisponible." });
        }

        if (!await ConfirmOrderInternal(order))
        {
            _logger.LogWarning("Confirmation de commande refusée : stock insuffisant ou conflit concurrent");
            return Conflict(new { message = "Stock insuffisant pour finaliser la commande." });
        }

        _logger.LogInformation("Commande confirmée par le serveur en mode {PaymentMode}", paymentMode);
        return Ok(new CheckoutConfirmationDto
        {
            Status = order.Status.ToString(),
            PaymentMode = paymentMode
        });
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
