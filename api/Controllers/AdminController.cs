using api.Data;
using api.DTOs;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = Roles.Admin)]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    public AdminController(AppDbContext db) => _db = db;

    /// <summary>Dashboard admin : chiffres clés + top produits (CA basé sur les commandes payées).</summary>
    [HttpGet("stats")]
    public async Task<ActionResult<AdminStatsDto>> Stats()
    {
        var paid = _db.Orders.Where(o => o.Status != OrderStatus.Pending);

        var top = await _db.OrderItems
            .Where(oi => oi.Order!.Status != OrderStatus.Pending)
            .GroupBy(oi => new { oi.ProductId, oi.Product!.Name })
            .Select(g => new TopProductDto
            {
                Name = g.Key.Name,
                QuantitySold = g.Sum(x => x.Quantity),
                Revenue = g.Sum(x => x.UnitPrice * x.Quantity)
            })
            .OrderByDescending(t => t.QuantitySold)
            .Take(5)
            .ToListAsync();

        return Ok(new AdminStatsDto
        {
            TotalProducts = await _db.Products.CountAsync(),
            TotalOrders = await _db.Orders.CountAsync(),
            TotalUsers = await _db.Users.CountAsync(),
            Revenue = await paid.SumAsync(o => (decimal?)o.TotalPrice) ?? 0,
            PendingSupport = await _db.SupportMessages.CountAsync(m => m.Status == SupportStatus.Open),
            TopProducts = top
        });
    }
}
