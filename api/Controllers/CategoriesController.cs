using api.Data;
using api.DTOs;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<CategoriesController> _logger;

    public CategoriesController(AppDbContext db, ILogger<CategoriesController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAll()
    {
        var cats = await _db.Categories.Include(c => c.Products).OrderBy(c => c.Name).ToListAsync();
        return Ok(cats.Select(c => c.ToDto()));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryDto>> GetById(int id)
    {
        var c = await _db.Categories.Include(x => x.Products).FirstOrDefaultAsync(x => x.Id == id);
        return c is null ? NotFound() : Ok(c.ToDto());
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<CategoryDto>> Create(CategoryWriteDto dto)
    {
        if (await _db.Categories.AnyAsync(c => c.Slug == dto.Slug))
            return Conflict(new { message = "Ce slug existe déjà." });
        var c = new Category { Name = dto.Name, Slug = dto.Slug };
        _db.Categories.Add(c);
        await _db.SaveChangesAsync();
        _logger.LogInformation(
            "Catégorie créée. CategoryId={CategoryId} TraceId={TraceId}",
            c.Id,
            HttpContext.TraceIdentifier);
        return CreatedAtAction(nameof(GetById), new { id = c.Id }, c.ToDto());
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<CategoryDto>> Update(int id, CategoryWriteDto dto)
    {
        var c = await _db.Categories.Include(x => x.Products).FirstOrDefaultAsync(x => x.Id == id);
        if (c is null) return NotFound();
        if (await _db.Categories.AnyAsync(x => x.Slug == dto.Slug && x.Id != id))
            return Conflict(new { message = "Ce slug existe déjà." });
        c.Name = dto.Name;
        c.Slug = dto.Slug;
        await _db.SaveChangesAsync();
        _logger.LogInformation(
            "Catégorie modifiée. CategoryId={CategoryId} TraceId={TraceId}",
            c.Id,
            HttpContext.TraceIdentifier);
        return Ok(c.ToDto());
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _db.Categories.FindAsync(id);
        if (c is null) return NotFound();
        if (await _db.Products.AnyAsync(p => p.CategoryId == id))
            return Conflict(new { message = "Catégorie non vide : déplacez ou supprimez ses produits d'abord." });
        _db.Categories.Remove(c);
        await _db.SaveChangesAsync();
        _logger.LogInformation(
            "Catégorie supprimée. CategoryId={CategoryId} TraceId={TraceId}",
            id,
            HttpContext.TraceIdentifier);
        return NoContent();
    }
}
