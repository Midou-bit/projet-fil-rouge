using System.Text.Json;
using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

/// <summary>
/// Import des jeux depuis FreeToGame (sans clé), exécuté EN ARRIÈRE-PLAN (jamais au démarrage) :
/// vrais jeux + vraies miniatures, seuils de perf générés depuis année+genre. Échec réseau avalé
/// → fallback curaté offline (cf. DbSeeder). Les composants n'utilisent pas de photo (visuel généré front).
/// </summary>
public class CatalogImportService
{
    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;
    private readonly ILogger<CatalogImportService> _log;

    public CatalogImportService(AppDbContext db, IHttpClientFactory http, IConfiguration config, ILogger<CatalogImportService> log)
    {
        _db = db;
        _http = http;
        _config = config;
        _log = log;
    }

    /// <summary>Importe les jeux free-to-play les plus populaires (sans clé). Renvoie le nombre importé
    /// (0 = échec/déjà peuplé → le caller peut retomber sur la liste curatée).</summary>
    public async Task<int> ImportGamesFromFreeToGameAsync()
    {
        if (await _db.Games.AnyAsync()) return 0; // déjà peuplé (relances)

        var count = int.TryParse(_config["Games:ImportCount"], out var c) ? c : 24;
        try
        {
            var client = _http.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(20);
            // ⚠️ User-Agent ASCII pur (un accent fait échouer HttpClient .NET).
            client.DefaultRequestHeaders.UserAgent.ParseAdd("FrameForge/1.0 (educational project)");

            using var resp = await client.GetAsync("https://www.freetogame.com/api/games?sort-by=popularity");
            resp.EnsureSuccessStatusCode();
            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());

            var imported = 0;
            foreach (var g in doc.RootElement.EnumerateArray())
            {
                if (imported >= count) break;

                var platform = g.TryGetProperty("platform", out var pf) ? pf.GetString() ?? "" : "";
                if (!platform.Contains("PC", StringComparison.OrdinalIgnoreCase)) continue; // PC uniquement

                var title = g.TryGetProperty("title", out var t) ? t.GetString() : null;
                if (string.IsNullOrWhiteSpace(title)) continue;

                var genre = g.TryGetProperty("genre", out var gn) ? gn.GetString() : null;
                var image = g.TryGetProperty("thumbnail", out var th) ? th.GetString() : null;
                var year = g.TryGetProperty("release_date", out var rd) && rd.ValueKind == JsonValueKind.String
                    && DateTime.TryParse(rd.GetString(), out var dt) ? dt.Year : DateTime.UtcNow.Year;

                var (baseGpu, baseCpu, ram) = EstimateDifficulty(year, genre);
                _db.Games.Add(new Game
                {
                    Title = title!,
                    ReleaseYear = year,
                    Genre = genre,
                    ImageUrl = image,
                    Requirements = GenerateRequirements(baseGpu, baseCpu, ram),
                });
                imported++;
            }
            await _db.SaveChangesAsync();
            _log.LogInformation("FreeToGame : {Count} jeux importés.", imported);
            return imported;
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Import FreeToGame échoué — fallback sur le seed curaté des jeux.");
            return 0;
        }
    }

    /// <summary>Estime l'exigence matérielle d'un jeu (modèle assumé) : année = poids principal,
    /// modulée par le genre. Pas de benchmark réel.</summary>
    internal static (int gpu, int cpu, int ram) EstimateDifficulty(int year, string? genre)
    {
        var span = Math.Clamp(year - 2012, 0, 14);
        var baseGpu = 32 + span * 3.6;   // 2012≈32 … 2025≈79
        var baseCpu = 38 + span * 2.4;   // 2012≈38 … 2025≈72

        var mod = (genre ?? "").ToLowerInvariant() switch
        {
            var s when s.Contains("shooter") => 10,
            var s when s.Contains("rpg") || s.Contains("role") => 8,
            var s when s.Contains("action") || s.Contains("adventure") => 5,
            var s when s.Contains("racing") => 4,
            var s when s.Contains("simulation") => 3,
            var s when s.Contains("strategy") => -4,
            var s when s.Contains("platformer") => -8,
            var s when s.Contains("puzzle") || s.Contains("card") => -12,
            var s when s.Contains("indie") || s.Contains("casual") || s.Contains("arcade") => -14,
            _ => 0,
        };

        var gpu = (int)Math.Clamp(baseGpu + mod, 20, 92);
        var cpu = (int)Math.Clamp(baseCpu + mod * 0.6, 22, 88);
        var ram = year >= 2020 ? 16 : (year >= 2016 ? 12 : 8);
        return (gpu, cpu, ram);
    }

    // Seuils propres à chaque couple résolution/FPS, identiques au principe du seed curaté.
    private static readonly (string Res, double Mul)[] ResMul = { ("1080p", 1.0), ("1440p", 1.1), ("4K", 1.25) };
    private static readonly (int Fps, double Mul)[] FpsMul = { (60, 1.0), (144, 1.4) };

    public static List<GameRequirement> GenerateRequirements(int baseGpu, int baseCpu, int ram)
    {
        var list = new List<GameRequirement>();
        foreach (var (res, rMul) in ResMul)
        foreach (var (fps, fMul) in FpsMul)
        {
            var recoGpu = Math.Clamp((int)Math.Round(baseGpu * rMul * fMul), 10, 100);
            var recoCpu = Math.Clamp((int)Math.Round(baseCpu * fMul), 10, 100);
            list.Add(new GameRequirement
            {
                Resolution = res,
                TargetFps = fps,
                RecoGpuScore = recoGpu,
                MinGpuScore = (int)Math.Round(recoGpu * 0.6),
                RecoCpuScore = recoCpu,
                MinCpuScore = (int)Math.Round(recoCpu * 0.6),
                MinRamGb = ram,
            });
        }
        return list;
    }
}
