using System.Text.Json;
using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

/// <summary>Compose des builds complets et choisit les upgrades (modes 2 & 3).</summary>
public class BuildService
{
    private readonly AppDbContext _db;
    public BuildService(AppDbContext db) => _db = db;

    /// <summary>Le moins cher d'une catégorie dont le PerfScore atteint le seuil ; sinon le plus puissant dispo.</summary>
    private async Task<Product?> CheapestMeeting(string slug, int minScore)
    {
        var inCat = _db.Products.Include(p => p.Category).Where(p => p.Category!.Slug == slug);
        var match = await inCat.Where(p => p.PerfScore >= minScore)
            .OrderBy(p => p.Price).FirstOrDefaultAsync();
        return match ?? await inCat.OrderByDescending(p => p.PerfScore).FirstOrDefaultAsync();
    }

    private Task<Product?> Cheapest(string slug) =>
        _db.Products.Include(p => p.Category)
            .Where(p => p.Category!.Slug == slug)
            .OrderBy(p => p.Price).FirstOrDefaultAsync();

    private Task<List<Product>> CatalogAsync(string slug) =>
        _db.Products.Include(p => p.Category)
            .Where(p => p.Category!.Slug == slug)
            .OrderBy(p => p.Price).ToListAsync();

    /// <summary>Lit une clé des specs JSON d'un produit (ex. "Socket", "Ram", "Type", "Tdp", "Wattage").</summary>
    private static string? Spec(Product? p, string key)
    {
        if (string.IsNullOrWhiteSpace(p?.Specs)) return null;
        try
        {
            using var doc = JsonDocument.Parse(p!.Specs!);
            return doc.RootElement.TryGetProperty(key, out var v)
                ? (v.ValueKind == JsonValueKind.String ? v.GetString() : v.ToString())
                : null;
        }
        catch { return null; }
    }

    private static int Digits(string? s)
    {
        if (s is null) return 0;
        var d = new string(s.Where(char.IsDigit).ToArray());
        return int.TryParse(d, out var n) ? n : 0;
    }

    /// <summary>Build complet recommandé pour un requirement de jeu — COHÉRENT (assemblable) :
    /// carte mère au socket du CPU, RAM au type de la carte mère, alim couvrant la conso du GPU.</summary>
    public async Task<List<Product>> RecommendBuild(GameRequirement req)
    {
        var gpu = await CheapestMeeting("gpu", req.RecoGpuScore);
        var cpu = await CheapestMeeting("cpu", req.RecoCpuScore);

        // Carte mère : la moins chère qui atteint le tier ET dont le socket correspond au CPU.
        var mobos = await CatalogAsync("carte-mere");
        var cpuSocket = Spec(cpu, "Socket");
        var mobo = mobos.Where(m => m.PerfScore >= 60 && (cpuSocket == null || Spec(m, "Socket") == cpuSocket))
                       .OrderBy(m => m.Price).FirstOrDefault()
                   ?? mobos.Where(m => cpuSocket == null || Spec(m, "Socket") == cpuSocket)
                       .OrderBy(m => m.Price).FirstOrDefault()
                   ?? mobos.OrderByDescending(m => m.PerfScore).FirstOrDefault();

        // RAM : suffisante pour le jeu ET du type de la carte mère.
        var rams = await CatalogAsync("ram");
        var minRamTier = req.MinRamGb >= 16 ? 70 : 50;
        var moboRam = Spec(mobo, "Ram");
        var ram = rams.Where(r => r.PerfScore >= minRamTier && (moboRam == null || Spec(r, "Type") == moboRam))
                      .OrderBy(r => r.Price).FirstOrDefault()
                  ?? rams.Where(r => moboRam == null || Spec(r, "Type") == moboRam)
                      .OrderBy(r => r.Price).FirstOrDefault()
                  ?? rams.OrderByDescending(r => r.PerfScore).FirstOrDefault();

        // Alim : couvre la conso estimée (GPU TDP + 150 W, marge ×1.3).
        var psus = await CatalogAsync("alimentation");
        var need = (int)Math.Ceiling((Digits(Spec(gpu, "Tdp")) + 150) * 1.3);
        var psu = psus.Where(p => Digits(Spec(p, "Wattage")) >= need).OrderBy(p => p.Price).FirstOrDefault()
                  ?? psus.OrderByDescending(p => Digits(Spec(p, "Wattage"))).FirstOrDefault();

        var parts = new List<Product?>
        {
            gpu, cpu, ram, await Cheapest("stockage"), mobo, psu, await Cheapest("boitier"),
        };
        return parts.Where(p => p is not null).Cast<Product>().ToList();
    }

    /// <summary>GPU le moins cher qui atteint le seuil recommandé (pour suggestion d'upgrade).</summary>
    public Task<Product?> UpgradeFor(string slug, int recoScore) => CheapestMeeting(slug, recoScore);
}
