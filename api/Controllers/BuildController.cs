using api.Data;
using api.DTOs;
using api.Services;
using Microsoft.AspNetCore.Mvc;
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
    public async Task<ActionResult<CheckResultDto>> Check(CheckRequestDto dto)
    {
        var gpu = await _db.Products.FindAsync(dto.GpuId);
        var cpu = await _db.Products.FindAsync(dto.CpuId);
        var game = await _db.Games.Include(g => g.Requirements).FirstOrDefaultAsync(g => g.Id == dto.GameId);
        if (gpu is null || cpu is null || game is null)
            return BadRequest(new { message = "CPU, GPU ou jeu introuvable." });

        var req = game.Requirements.FirstOrDefault(r => r.Resolution == dto.Resolution && r.TargetFps == dto.TargetFps)
                  ?? game.Requirements.OrderBy(r => r.RecoGpuScore).FirstOrDefault();
        if (req is null) return BadRequest(new { message = "Aucun prérequis pour ce jeu." });

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
    public async Task<ActionResult<ScoreSummaryDto>> Calc(BuildCalcRequestDto dto)
    {
        var products = await _db.Products.Include(p => p.Category)
            .Where(p => dto.ProductIds.Contains(p.Id)).ToListAsync();

        var gpu = products.FirstOrDefault(p => p.Category?.Slug == "gpu");
        var cpu = products.FirstOrDefault(p => p.Category?.Slug == "cpu");
        var total = products.Sum(p => p.Price);
        var ram = ParseRamGb(products.FirstOrDefault(p => p.Category?.Slug == "ram"));

        var gpuScore = gpu?.PerfScore ?? 0;
        var cpuScore = cpu?.PerfScore ?? 0;

        if (dto.GameId is { } gid)
        {
            var game = await _db.Games.Include(g => g.Requirements).FirstOrDefaultAsync(g => g.Id == gid);
            var req = game?.Requirements.FirstOrDefault(r => r.Resolution == dto.Resolution && r.TargetFps == dto.TargetFps)
                      ?? game?.Requirements.OrderBy(r => r.RecoGpuScore).FirstOrDefault();
            if (req is not null)
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

    private static int ParseRamGb(Models.Product? ram)
    {
        if (ram?.Specs is null) return 16;
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(ram.Specs);
            if (doc.RootElement.TryGetProperty("Capacity", out var cap))
            {
                var digits = new string(cap.GetString()!.TakeWhile(char.IsDigit).ToArray());
                if (int.TryParse(digits, out var gb)) return gb;
            }
        }
        catch { /* specs libres : on retombe sur la valeur par défaut */ }
        return 16;
    }
}
