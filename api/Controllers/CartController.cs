using System.Security.Claims;
using api.Data;
using api.DTOs;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/cart")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly AppDbContext _db;
    public CartController(AppDbContext db) => _db = db;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    private async Task<Cart> GetOrCreateCartAsync()
    {
        var cart = await _db.Carts
            .Include(c => c.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == UserId);
        if (cart is null)
        {
            cart = new Cart { UserId = UserId };
            _db.Carts.Add(cart);
            await _db.SaveChangesAsync();
        }
        return cart;
    }

    private static CartDto ToDto(Cart cart)
    {
        var items = cart.Items.Select(i => new CartItemDto
        {
            Id = i.Id,
            ProductId = i.ProductId,
            ProductName = i.Product?.Name ?? "",
            ImageUrl = i.Product?.ImageUrl,
            UnitPrice = i.Product?.Price ?? 0,
            Quantity = i.Quantity,
            Stock = i.Product?.Stock ?? 0
        }).ToList();
        return new CartDto
        {
            Items = items,
            Total = items.Sum(i => i.LineTotal),
            ItemCount = items.Sum(i => i.Quantity)
        };
    }

    [HttpGet]
    public async Task<ActionResult<CartDto>> Get() => Ok(ToDto(await GetOrCreateCartAsync()));

    [HttpPost("items")]
    public async Task<ActionResult<CartDto>> AddItem(AddCartItemDto dto)
    {
        var product = await _db.Products.FindAsync(dto.ProductId);
        if (product is null) return NotFound(new { message = "Produit introuvable." });

        var cart = await GetOrCreateCartAsync();
        var line = cart.Items.FirstOrDefault(i => i.ProductId == dto.ProductId);
        var newQty = (line?.Quantity ?? 0) + dto.Quantity;
        if (newQty > product.Stock)
            return BadRequest(new { message = $"Stock insuffisant (disponible : {product.Stock})." });

        if (line is null)
            cart.Items.Add(new CartItem { ProductId = dto.ProductId, Quantity = dto.Quantity });
        else
            line.Quantity = newQty;

        await _db.SaveChangesAsync();
        return Ok(ToDto(await GetOrCreateCartAsync()));
    }

    [HttpPut("items/{id:int}")]
    public async Task<ActionResult<CartDto>> UpdateItem(int id, UpdateCartItemDto dto)
    {
        var cart = await GetOrCreateCartAsync();
        var line = cart.Items.FirstOrDefault(i => i.Id == id);
        if (line is null) return NotFound();
        if (dto.Quantity > (line.Product?.Stock ?? 0))
            return BadRequest(new { message = $"Stock insuffisant (disponible : {line.Product?.Stock})." });
        line.Quantity = dto.Quantity;
        await _db.SaveChangesAsync();
        return Ok(ToDto(cart));
    }

    [HttpDelete("items/{id:int}")]
    public async Task<ActionResult<CartDto>> RemoveItem(int id)
    {
        var cart = await GetOrCreateCartAsync();
        var line = cart.Items.FirstOrDefault(i => i.Id == id);
        if (line is null) return NotFound();
        cart.Items.Remove(line);
        await _db.SaveChangesAsync();
        return Ok(ToDto(cart));
    }

    [HttpDelete]
    public async Task<ActionResult<CartDto>> Clear()
    {
        var cart = await GetOrCreateCartAsync();
        cart.Items.Clear();
        await _db.SaveChangesAsync();
        return Ok(ToDto(cart));
    }
}
