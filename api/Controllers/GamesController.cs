using api.Data;
using api.DTOs;
using api.Services;
using Microsoft.AspNetCore.Mvc;
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
    public async Task<ActionResult<BuildRecommendationDto>> GetBuild(
        int id, [FromQuery] string resolution = "1080p", [FromQuery] int fps = 60)
    {
        var game = await _db.Games.Include(g => g.Requirements).FirstOrDefaultAsync(g => g.Id == id);
        if (game is null) return NotFound();

        var req = game.Requirements.FirstOrDefault(r => r.Resolution == resolution && r.TargetFps == fps)
                  ?? game.Requirements.OrderBy(r => r.RecoGpuScore).FirstOrDefault();
        if (req is null) return NotFound(new { message = "Aucun prérequis défini pour ce jeu." });

        var parts = await _builds.RecommendBuild(req);
        var gpu = parts.FirstOrDefault(p => p.Category?.Slug == "gpu");
        var cpu = parts.FirstOrDefault(p => p.Category?.Slug == "cpu");
        var total = parts.Sum(p => p.Price);

        var result = _scoring.Evaluate(gpu?.PerfScore ?? 0, cpu?.PerfScore ?? 0, 32, req, total);

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
