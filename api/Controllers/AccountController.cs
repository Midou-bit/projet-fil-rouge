using System.Security.Claims;
using api.Data;
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
    public AccountController(AppDbContext db, UserManager<ApplicationUser> users)
    {
        _db = db;
        _users = users;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    /// <summary>RGPD — droit à l'effacement (« droit à l'oubli ») : supprime le compte de l'utilisateur
    /// connecté ET toutes ses données personnelles associées (avis, panier, messages, commandes).</summary>
    [HttpDelete]
    public async Task<IActionResult> Delete()
    {
        var uid = UserId;
        var user = await _users.FindByIdAsync(uid);
        if (user is null) return NotFound();

        // On protège les comptes de démonstration seed pour garder la démo fonctionnelle.
        if (user.Email is "admin@frameforge.dev" or "client@frameforge.dev")
            return BadRequest(new { message = "Les comptes de démonstration ne peuvent pas être supprimés." });

        // Purge des données personnelles liées (les items en cascade), puis le compte lui-même.
        _db.Reviews.RemoveRange(_db.Reviews.Where(r => r.UserId == uid));
        _db.SupportMessages.RemoveRange(_db.SupportMessages.Where(m => m.UserId == uid));
        var cart = await _db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == uid);
        if (cart is not null) _db.Carts.Remove(cart);
        var orders = await _db.Orders.Include(o => o.Items).Where(o => o.UserId == uid).ToListAsync();
        _db.Orders.RemoveRange(orders);
        await _db.SaveChangesAsync();

        await _users.DeleteAsync(user);
        return NoContent();
    }
}
