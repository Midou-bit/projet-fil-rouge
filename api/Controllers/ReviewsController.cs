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
[Route("api/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReviewsController(AppDbContext db) => _db = db;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ReviewDto>> Create(CreateReviewDto dto)
    {
        if (!await _db.Products.AnyAsync(p => p.Id == dto.ProductId))
            return NotFound(new { message = "Produit introuvable." });

        // Avis vérifié : réservé aux clients ayant effectivement commandé ce produit (Paid/Shipped).
        var purchased = await _db.OrderItems.AnyAsync(oi =>
            oi.ProductId == dto.ProductId &&
            oi.Order!.UserId == UserId &&
            (oi.Order.Status == OrderStatus.Paid || oi.Order.Status == OrderStatus.Shipped));
        if (!purchased)
            return BadRequest(new { message = "Tu dois avoir acheté ce produit pour laisser un avis." });

        // Un seul avis par utilisateur et par produit.
        var existing = await _db.Reviews.FirstOrDefaultAsync(r => r.ProductId == dto.ProductId && r.UserId == UserId);
        if (existing is not null)
        {
            existing.Rating = dto.Rating;
            existing.Comment = dto.Comment;
            existing.CreatedAt = DateTime.UtcNow;
        }
        else
        {
            existing = new Review
            {
                ProductId = dto.ProductId,
                UserId = UserId,
                Rating = dto.Rating,
                Comment = dto.Comment
            };
            _db.Reviews.Add(existing);
        }
        await _db.SaveChangesAsync();

        return Ok(new ReviewDto
        {
            Id = existing.Id,
            Rating = existing.Rating,
            Comment = existing.Comment,
            Author = Mapping.ReviewAuthor(UserId),
            CreatedAt = existing.CreatedAt
        });
    }
}
