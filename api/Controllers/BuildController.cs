using api.Data;
using api.DTOs;
using api.Services;
using api.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api")]
public class BuildController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ScoringService _scoring;
    private readonly BuildService _builds;

    public BuildController(AppDbContext db, ScoringService scoring, BuildService builds)
    {
        _db = db;
        _scoring = scoring;
        _builds = builds;
    }

    /// <summary>Le vérificateur : "mon PC fait-il tourner X ?" + suggestion d'upgrade si trop faible.</summary>
    [HttpPost("check")]
    [EnableRateLimiting(RateLimitPolicies.Compute)]
    public async Task<ActionResult<CheckResultDto>> Check(CheckRequestDto dto)
    {
        var gpu = await _db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == dto.GpuId);
        var cpu = await _db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == dto.CpuId);
        var game = await _db.Games.Include(g => g.Requirements).FirstOrDefaultAsync(g => g.Id == dto.GameId);
        if (gpu is null || cpu is null || game is null)
            return BadRequest(new { message = "CPU, GPU ou jeu introuvable." });
        if (gpu.Category?.Slug != "gpu")
            return BadRequest(new { message = "Le produit sélectionné comme GPU n'appartient pas à la catégorie GPU." });
        if (cpu.Category?.Slug != "cpu")
            return BadRequest(new { message = "Le produit sélectionné comme CPU n'appartient pas à la catégorie CPU." });

        var req = game.Requirements.FirstOrDefault(r =>
            r.Resolution == dto.Resolution && r.TargetFps == dto.TargetFps);
        if (req is null) return BadRequest(new { message = "Aucun prérequis pour cette résolution et cette cible FPS." });

        var result = _scoring.Evaluate(gpu.PerfScore, cpu.PerfScore, dto.RamGb, req, gpu.Price + cpu.Price);

        var resultDto = new CheckResultDto
        {
            GameTitle = game.Title,
            Resolution = req.Resolution,
            TargetFps = req.TargetFps,
            Score = result.ToSummary()
        };

        // Suggestions d'upgrade avec lien d'achat (mode 3)
        if (gpu.PerfScore < req.RecoGpuScore)
        {
            var up = await _builds.UpgradeFor("gpu", req.RecoGpuScore);
            if (up is not null && up.Id != gpu.Id) resultDto.SuggestedGpuUpgrade = up.ToDto();
        }
        if (cpu.PerfScore < req.RecoCpuScore)
        {
            var up = await _builds.UpgradeFor("cpu", req.RecoCpuScore);
            if (up is not null && up.Id != cpu.Id) resultDto.SuggestedCpuUpgrade = up.ToDto();
        }

        return Ok(resultDto);
    }

    /// <summary>Builder interactif : recalcule les barres de stats pour une sélection de composants.</summary>
    [HttpPost("build/calc")]
    [EnableRateLimiting(RateLimitPolicies.Compute)]
    public async Task<ActionResult<ScoreSummaryDto>> Calc(BuildCalcRequestDto dto)
    {
        if (dto.ProductIds.Any(id => id <= 0))
            return BadRequest(new { message = "Les identifiants de produits doivent être positifs." });

        var requestedIds = dto.ProductIds.Distinct().ToArray();
        var products = await _db.Products.Include(p => p.Category)
            .Where(p => requestedIds.Contains(p.Id)).ToListAsync();
        if (products.Count != requestedIds.Length)
            return BadRequest(new { message = "Un ou plusieurs produits sont introuvables." });

        var gpu = products.FirstOrDefault(p => p.Category?.Slug == "gpu");
        var cpu = products.FirstOrDefault(p => p.Category?.Slug == "cpu");
        var total = products.Sum(p => p.Price);
        var ram = ParseRamGb(products.FirstOrDefault(p => p.Category?.Slug == "ram"));

        var gpuScore = gpu?.PerfScore ?? 0;
        var cpuScore = cpu?.PerfScore ?? 0;

        if (dto.GameId is { } gid)
        {
            var game = await _db.Games.Include(g => g.Requirements).FirstOrDefaultAsync(g => g.Id == gid);
            if (game is null) return BadRequest(new { message = "Jeu introuvable." });
            var req = game.Requirements.FirstOrDefault(r =>
                r.Resolution == dto.Resolution && r.TargetFps == dto.TargetFps);
            if (req is null)
                return BadRequest(new { message = "Aucun prérequis pour cette résolution et cette cible FPS." });
            return Ok(_scoring.Evaluate(gpuScore, cpuScore, ram, req, total).ToSummary());
        }

        // Sans jeu cible : barres "génériques" (perf gaming + prix), pas de FPS.
        return Ok(new ScoreSummaryDto
        {
            GamingPerformance = _scoring.GamingPerformance(gpuScore, cpuScore),
            CpuPower = cpuScore,
            BottleneckPenalty = _scoring.BottleneckPenalty(gpuScore, cpuScore),
            PriceValue = _scoring.PriceValue(_scoring.GamingPerformance(gpuScore, cpuScore), total),
            VisualQuality = "—",
            Verdict = gpu is null || cpu is null ? "Build incomplet (CPU + GPU requis)" : "Build prêt"
        });
    }

    private static int ParseRamGb(Models.Product? ram) => ProductSpecs.ReadNumber(ram, "Capacity");
}
