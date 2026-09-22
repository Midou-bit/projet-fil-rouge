using System.Security.Claims;
using api.Data;
using api.DTOs;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/account")]
[Authorize]
public class AccountController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _users;
    private readonly ILogger<AccountController> _logger;

    public AccountController(
        AppDbContext db,
        UserManager<ApplicationUser> users,
        ILogger<AccountController> logger)
    {
        _db = db;
        _users = users;
        _logger = logger;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    /// <summary>
    /// RGPD — droit d'accès et à la portabilité : exporte uniquement les données du compte
    /// authentifié. Aucun champ interne Identity, token ou identifiant Stripe n'est exposé.
    /// </summary>
    [HttpGet("export")]
    [Produces("application/json")]
    public async Task<ActionResult<AccountExportDto>> Export(CancellationToken cancellationToken)
    {
        var uid = UserId;
        var user = await _users.FindByIdAsync(uid);
        if (user is null) return NotFound();

        var roles = await _users.GetRolesAsync(user);
        var cart = await _db.Carts
            .AsNoTracking()
            .Where(c => c.UserId == uid)
            .Select(c => new AccountExportCartDto
            {
                Items = c.Items.Select(item => new AccountExportItemDto
                {
                    ProductId = item.ProductId,
                    ProductName = item.Product != null ? item.Product.Name : "(produit indisponible)",
                    UnitPrice = item.Product != null ? item.Product.Price : 0,
                    Quantity = item.Quantity,
                }).ToList(),
                Total = c.Items.Sum(item =>
                    (item.Product != null ? item.Product.Price : 0) * item.Quantity),
            })
            .SingleOrDefaultAsync(cancellationToken)
            ?? new AccountExportCartDto();

        var orders = await _db.Orders
            .AsNoTracking()
            .Where(order => order.UserId == uid)
            .OrderByDescending(order => order.CreatedAt)
            .Select(order => new AccountExportOrderDto
            {
                Id = order.Id,
                TotalPrice = order.TotalPrice,
                Status = order.Status.ToString(),
                CreatedAt = order.CreatedAt,
                Items = order.Items.Select(item => new AccountExportItemDto
                {
                    ProductId = item.ProductId,
                    ProductName = item.Product != null ? item.Product.Name : "(produit indisponible)",
                    UnitPrice = item.UnitPrice,
                    Quantity = item.Quantity,
                }).ToList(),
            })
            .ToListAsync(cancellationToken);

        var reviews = await _db.Reviews
            .AsNoTracking()
            .Where(review => review.UserId == uid)
            .OrderByDescending(review => review.CreatedAt)
            .Select(review => new AccountExportReviewDto
            {
                Id = review.Id,
                ProductId = review.ProductId,
                ProductName = review.Product != null ? review.Product.Name : "(produit indisponible)",
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        // Un message invité portant la même adresse email n'est PAS considéré comme appartenant
        // au compte : seule la clé utilisateur authentifiée établit la propriété de la donnée.
        var supportMessages = await _db.SupportMessages
            .AsNoTracking()
            .Where(message => message.UserId == uid)
            .OrderByDescending(message => message.CreatedAt)
            .Select(message => new AccountExportSupportMessageDto
            {
                Id = message.Id,
                Email = message.Email,
                Subject = message.Subject,
                Message = message.Message,
                Status = message.Status.ToString(),
                CreatedAt = message.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        _logger.LogInformation(
            "Export de compte généré. TraceId={TraceId}",
            HttpContext.TraceIdentifier);

        return Ok(new AccountExportDto
        {
            ExportedAtUtc = DateTime.UtcNow,
            Account = new AccountExportProfileDto
            {
                Email = user.Email ?? string.Empty,
                CreatedAt = user.CreatedAt,
                Roles = roles.OrderBy(role => role, StringComparer.Ordinal).ToList(),
            },
            Cart = cart,
            Orders = orders,
            Reviews = reviews,
            SupportMessages = supportMessages,
        });
    }

    /// <summary>RGPD — droit à l'effacement (« droit à l'oubli ») : supprime le compte de l'utilisateur
    /// connecté ET toutes ses données personnelles associées (avis, panier, messages, commandes).</summary>
    [HttpDelete]
    public async Task<IActionResult> Delete(CancellationToken cancellationToken)
    {
        var uid = UserId;
        var user = await _users.FindByIdAsync(uid);
        if (user is null) return NotFound();

        // On protège les comptes de démonstration seed pour garder la démo fonctionnelle.
        if (user.Email is "admin@frameforge.dev" or "client@frameforge.dev")
            return BadRequest(new { message = "Les comptes de démonstration ne peuvent pas être supprimés." });

        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Purge des données personnelles liées (items en cascade), puis du compte Identity.
            // Le tout partage la même transaction : un échec de DeleteAsync restaure les données.
            _db.Reviews.RemoveRange(_db.Reviews.Where(review => review.UserId == uid));
            _db.SupportMessages.RemoveRange(_db.SupportMessages.Where(message => message.UserId == uid));

            var cart = await _db.Carts
                .Include(current => current.Items)
                .FirstOrDefaultAsync(current => current.UserId == uid, cancellationToken);
            if (cart is not null) _db.Carts.Remove(cart);

            var orders = await _db.Orders
                .Include(order => order.Items)
                .Where(order => order.UserId == uid)
                .ToListAsync(cancellationToken);
            _db.Orders.RemoveRange(orders);
            await _db.SaveChangesAsync(cancellationToken);

            var identityResult = await _users.DeleteAsync(user);
            if (!identityResult.Succeeded)
            {
                await transaction.RollbackAsync(cancellationToken);
                _db.ChangeTracker.Clear();
                _logger.LogError(
                    "Suppression de compte refusée par Identity. ErrorCount={ErrorCount} TraceId={TraceId}",
                    identityResult.Errors.Count(),
                    HttpContext.TraceIdentifier);
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new { message = "La suppression du compte n'a pas pu être finalisée." });
            }

            await transaction.CommitAsync(cancellationToken);
            _logger.LogInformation(
                "Compte et données associées supprimés. TraceId={TraceId}",
                HttpContext.TraceIdentifier);
            return NoContent();
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            _db.ChangeTracker.Clear();
            throw;
        }
        catch (Exception exception)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            _db.ChangeTracker.Clear();
            // Ne jamais journaliser message/stack ici : une exception DB peut contenir un chemin
            // de fichier ou une donnée. Le type suffit pour l'exploitation sans fuite de PII.
            _logger.LogError(
                "Échec transactionnel de suppression. FailureType={FailureType} TraceId={TraceId}",
                exception.GetType().Name,
                HttpContext.TraceIdentifier);
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new { message = "La suppression du compte n'a pas pu être finalisée." });
        }
    }
}
