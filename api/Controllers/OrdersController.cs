using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using api.Data;
using api.DTOs;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(AppDbContext db, ILogger<OrdersController> logger)
    {
        _db = db;
        _logger = logger;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    /// <summary>Historique des commandes du client connecté.</summary>
    [HttpGet("orders")]
    public async Task<ActionResult<IEnumerable<OrderDto>>> MyOrders()
    {
        var orders = await _db.Orders
            .Where(o => o.UserId == UserId)
            .Include(o => o.Items).ThenInclude(i => i.Product)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        return Ok(orders.Select(o => o.ToDto()));
    }

    [HttpGet("orders/{id:int}")]
    public async Task<ActionResult<OrderDto>> GetOne(int id)
    {
        var o = await _db.Orders
            .Include(x => x.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        return o is null ? NotFound() : Ok(o.ToDto());
    }

    /// <summary>Annule une commande encore en attente (avant confirmation du paiement). Le stock
    /// n'est décrémenté qu'à la confirmation (Paid) : rien à re-créditer pour une commande Pending.</summary>
    [HttpPost("orders/{id:int}/cancel")]
    public async Task<ActionResult<OrderDto>> Cancel(int id)
    {
        var o = await _db.Orders
            .Include(x => x.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (o is null) return NotFound();
        if (o.Status != OrderStatus.Pending)
            return BadRequest(new { message = "Seule une commande en attente peut être annulée." });

        o.Status = OrderStatus.Cancelled;
        await _db.SaveChangesAsync();
        return Ok(o.ToDto());
    }

    /// <summary>Toutes les commandes (admin).</summary>
    [HttpGet("admin/orders")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<IEnumerable<OrderDto>>> AllOrders()
    {
        var orders = await _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.Product)
            .Include(o => o.User)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        return Ok(orders.Select(o => o.ToDto(o.User?.Email)));
    }

    /// <summary>Mise à jour du statut d'une commande (admin) : Pending/Paid/Shipped.</summary>
    [HttpPut("admin/orders/{id:int}/status")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        var o = await _db.Orders.FindAsync(id);
        if (o is null) return NotFound();
        var rawStatus = dto.Status.Trim();
        if (int.TryParse(rawStatus, out _) ||
            !Enum.TryParse<OrderStatus>(rawStatus, true, out var status) ||
            !Enum.IsDefined(status))
            return BadRequest(new { message = "Statut invalide." });
        o.Status = status;
        await _db.SaveChangesAsync();
        _logger.LogInformation(
            "Statut de commande modifié. Status={Status} TraceId={TraceId}",
            o.Status,
            HttpContext.TraceIdentifier);
        return Ok(new { status = o.Status.ToString() });
    }
}

public class UpdateOrderStatusDto
{
    [Required, StringLength(20)]
    public string Status { get; set; } = string.Empty;
}
