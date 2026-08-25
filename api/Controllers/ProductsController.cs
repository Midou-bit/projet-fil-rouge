using api.Data;
using api.DTOs;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ProductsController(AppDbContext db) => _db = db;

    /// <summary>Catalogue avec recherche, filtres (catégorie, marque, prix, perf) et tri paginés.</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] string? brand,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] int? minPerf,
        [FromQuery] string sort = "name",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var q = _db.Products
            .Include(p => p.Category)
            .Include(p => p.Reviews)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            q = q.Where(p => p.Name.ToLower().Contains(s) || p.Brand.ToLower().Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(category))
            q = q.Where(p => p.Category!.Slug == category);
        if (!string.IsNullOrWhiteSpace(brand))
            q = q.Where(p => p.Brand == brand);
        if (minPrice.HasValue) q = q.Where(p => p.Price >= minPrice.Value);
        if (maxPrice.HasValue) q = q.Where(p => p.Price <= maxPrice.Value);
        if (minPerf.HasValue) q = q.Where(p => p.PerfScore >= minPerf.Value);

        q = sort switch
        {
            "price_asc" => q.OrderBy(p => p.Price),
            "price_desc" => q.OrderByDescending(p => p.Price),
            "perf" => q.OrderByDescending(p => p.PerfScore),
            "newest" => q.OrderByDescending(p => p.Id),
            _ => q.OrderBy(p => p.Name)
        };

        var total = await q.CountAsync();
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var items = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new PagedResult<ProductDto>
        {
            Items = items.Select(p => p.ToDto()),
            Total = total,
            Page = page,
            PageSize = pageSize
        });
    }

    /// <summary>Liste des marques distinctes (pour les filtres front).</summary>
    [HttpGet("brands")]
    public async Task<ActionResult<IEnumerable<string>>> GetBrands()
        => Ok(await _db.Products.Select(p => p.Brand).Distinct().OrderBy(b => b).ToListAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        var p = await _db.Products
            .Include(x => x.Category)
            .Include(x => x.Reviews)
            .FirstOrDefaultAsync(x => x.Id == id);
        return p is null ? NotFound() : Ok(p.ToDto());
    }

    [HttpGet("{id:int}/reviews")]
    public async Task<ActionResult<IEnumerable<ReviewDto>>> GetReviews(int id)
    {
        var rows = await _db.Reviews
            .Where(r => r.ProductId == id)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new { r.Id, r.Rating, r.Comment, r.CreatedAt, r.UserId })
            .ToListAsync();
        var reviews = rows.Select(r => new ReviewDto
        {
            Id = r.Id,
            Rating = r.Rating,
            Comment = r.Comment,
            Author = Mapping.ReviewAuthor(r.UserId),
            CreatedAt = r.CreatedAt
        });
        return Ok(reviews);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<ProductDto>> Create(ProductWriteDto dto)
    {
        if (!await _db.Categories.AnyAsync(c => c.Id == dto.CategoryId))
            return BadRequest(new { message = "Catégorie inconnue." });

        var p = new Product
        {
            Name = dto.Name,
            Brand = dto.Brand,
            Price = dto.Price,
            Stock = dto.Stock,
            ImageUrl = dto.ImageUrl,
            Description = dto.Description,
            PerfScore = dto.PerfScore,
            Specs = dto.Specs,
            CategoryId = dto.CategoryId
        };
        _db.Products.Add(p);
        await _db.SaveChangesAsync();
        await _db.Entry(p).Reference(x => x.Category).LoadAsync();
        return CreatedAtAction(nameof(GetById), new { id = p.Id }, p.ToDto());
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<ProductDto>> Update(int id, ProductWriteDto dto)
    {
        var p = await _db.Products.Include(x => x.Category).Include(x => x.Reviews)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return NotFound();
        if (!await _db.Categories.AnyAsync(c => c.Id == dto.CategoryId))
            return BadRequest(new { message = "Catégorie inconnue." });

        p.Name = dto.Name;
        p.Brand = dto.Brand;
        p.Price = dto.Price;
        p.Stock = dto.Stock;
        p.ImageUrl = dto.ImageUrl;
        p.Description = dto.Description;
        p.PerfScore = dto.PerfScore;
        p.Specs = dto.Specs;
        p.CategoryId = dto.CategoryId;
        await _db.SaveChangesAsync();
        await _db.Entry(p).Reference(x => x.Category).LoadAsync();
        return Ok(p.ToDto());
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await _db.Products.FindAsync(id);
        if (p is null) return NotFound();

        // Protégé : on n'efface pas un produit déjà commandé (intégrité historique).
        if (await _db.OrderItems.AnyAsync(oi => oi.ProductId == id))
            return Conflict(new { message = "Produit présent dans des commandes : impossible de le supprimer." });

        _db.Products.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
