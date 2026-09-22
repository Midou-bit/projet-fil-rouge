using api.Data;
using api.DTOs;
using api.Services;
using api.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/games")]
public class GamesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly BuildService _builds;
    private readonly ScoringService _scoring;

    public GamesController(AppDbContext db, BuildService builds, ScoringService scoring)
    {
        _db = db;
        _builds = builds;
        _scoring = scoring;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<GameDto>>> GetAll()
    {
        var games = await _db.Games.Include(g => g.Requirements).OrderBy(g => g.Title).ToListAsync();
        return Ok(games.Select(g => g.ToDto()));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<GameDto>> GetById(int id)
    {
        var g = await _db.Games.Include(x => x.Requirements).FirstOrDefaultAsync(x => x.Id == id);
        return g is null ? NotFound() : Ok(g.ToDto());
    }

    /// <summary>Mode "je veux jouer à X" : build complet recommandé pour un jeu/résolution/fps.</summary>
    [HttpGet("{id:int}/build")]
    [EnableRateLimiting(RateLimitPolicies.Compute)]
    public async Task<ActionResult<BuildRecommendationDto>> GetBuild(
        int id, [FromQuery] string resolution = "1080p", [FromQuery] int fps = 60)
    {
        if (resolution is not ("1080p" or "1440p" or "4K"))
            return BadRequest(new { message = "Résolution invalide. Valeurs autorisées : 1080p, 1440p, 4K." });
        if (fps is not (60 or 144))
            return BadRequest(new { message = "Cible FPS invalide. Valeurs autorisées : 60, 144." });

        var game = await _db.Games.Include(g => g.Requirements).FirstOrDefaultAsync(g => g.Id == id);
        if (game is null) return NotFound();

        var req = game.Requirements.FirstOrDefault(r =>
            r.Resolution == resolution && r.TargetFps == fps);
        if (req is null) return NotFound(new { message = "Aucun prérequis défini pour cette résolution et cette cible FPS." });

        var parts = await _builds.RecommendBuild(req);
        var gpu = parts.FirstOrDefault(p => p.Category?.Slug == "gpu");
        var cpu = parts.FirstOrDefault(p => p.Category?.Slug == "cpu");
        var ram = parts.FirstOrDefault(p => p.Category?.Slug == "ram");
        var total = parts.Sum(p => p.Price);

        var result = _scoring.Evaluate(
            gpu?.PerfScore ?? 0,
            cpu?.PerfScore ?? 0,
            ProductSpecs.ReadNumber(ram, "Capacity"),
            req,
            total);

        return Ok(new BuildRecommendationDto
        {
            Game = game.ToDto(),
            Resolution = req.Resolution,
            TargetFps = req.TargetFps,
            Parts = parts.Select(p => p.ToDto()).ToList(),
            TotalPrice = total,
            Score = result.ToSummary()
        });
    }
}
