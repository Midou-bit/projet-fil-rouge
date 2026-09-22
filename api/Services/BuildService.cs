using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

/// <summary>Compose des builds complets et choisit les upgrades (modes 2 & 3).</summary>
public class BuildService
{
    private readonly AppDbContext _db;
    public BuildService(AppDbContext db) => _db = db;

    /// <summary>
    /// Le moins cher en stock atteignant le seuil ; sinon le plus puissant en stock.
    /// Un produit hors stock n'est repris qu'en dernier recours si toute la catégorie est indisponible.
    /// </summary>
    private async Task<Product?> CheapestMeeting(string slug, int minScore)
    {
        var inCat = _db.Products.Include(p => p.Category).Where(p => p.Category!.Slug == slug);
        var available = inCat.Where(p => p.Stock > 0);
        var match = await available.Where(p => p.PerfScore >= minScore)
            .OrderBy(p => p.Price).FirstOrDefaultAsync();
        return match
            ?? await available.OrderByDescending(p => p.PerfScore).ThenBy(p => p.Price).FirstOrDefaultAsync()
            ?? await inCat.Where(p => p.PerfScore >= minScore).OrderBy(p => p.Price).FirstOrDefaultAsync()
            ?? await inCat.OrderByDescending(p => p.PerfScore).ThenBy(p => p.Price).FirstOrDefaultAsync();
    }

    private async Task<Product?> Cheapest(string slug)
    {
        var inCat = _db.Products.Include(p => p.Category).Where(p => p.Category!.Slug == slug);
        return await inCat.Where(p => p.Stock > 0).OrderBy(p => p.Price).FirstOrDefaultAsync()
            ?? await inCat.OrderBy(p => p.Price).FirstOrDefaultAsync();
    }

    private Task<List<Product>> CatalogAsync(string slug) =>
        _db.Products.Include(p => p.Category)
            .Where(p => p.Category!.Slug == slug)
            .OrderBy(p => p.Price).ToListAsync();

    private static List<Product> PreferInStock(IEnumerable<Product> products)
    {
        var all = products.ToList();
        var available = all.Where(p => p.Stock > 0).ToList();
        return available.Count > 0 ? available : all;
    }

    /// <summary>Build complet recommandé pour un requirement de jeu — COHÉRENT (assemblable) :
    /// carte mère au socket du CPU, RAM au type de la carte mère, alim couvrant la conso du GPU.</summary>
    public async Task<List<Product>> RecommendBuild(GameRequirement req)
    {
        var gpu = await CheapestMeeting("gpu", req.RecoGpuScore);
        var cpu = await CheapestMeeting("cpu", req.RecoCpuScore);

        // Carte mère : la moins chère qui atteint le tier ET dont le socket correspond au CPU.
        var mobos = await CatalogAsync("carte-mere");
        var cpuSocket = ProductSpecs.Read(cpu, "Socket");
        var compatibleMobos = mobos
            .Where(m => cpuSocket == null || ProductSpecs.Read(m, "Socket") == cpuSocket)
            .ToList();
        var mobo = PreferInStock(compatibleMobos.Where(m => m.PerfScore >= 60))
                       .OrderBy(m => m.Price).FirstOrDefault()
                   ?? PreferInStock(compatibleMobos).OrderBy(m => m.Price).FirstOrDefault()
                   ?? PreferInStock(mobos).OrderByDescending(m => m.PerfScore).ThenBy(m => m.Price).FirstOrDefault();

        // RAM : capacité suffisante pour le jeu ET type compatible avec la carte mère.
        var rams = await CatalogAsync("ram");
        var moboRam = ProductSpecs.Read(mobo, "Ram");
        var compatibleRams = rams
            .Where(r => moboRam == null || ProductSpecs.Read(r, "Type") == moboRam)
            .ToList();
        var sufficientRams = compatibleRams
            .Where(r => ProductSpecs.ReadNumber(r, "Capacity") >= req.MinRamGb);
        var ram = PreferInStock(sufficientRams).OrderBy(r => r.Price).FirstOrDefault()
                  ?? PreferInStock(compatibleRams)
                      .OrderByDescending(r => ProductSpecs.ReadNumber(r, "Capacity")).ThenBy(r => r.Price).FirstOrDefault()
                  ?? PreferInStock(rams)
                      .OrderByDescending(r => ProductSpecs.ReadNumber(r, "Capacity")).ThenBy(r => r.Price).FirstOrDefault();

        // Alim : couvre la conso estimée (GPU TDP + 150 W, marge ×1.3).
        var psus = await CatalogAsync("alimentation");
        var need = (int)Math.Ceiling((ProductSpecs.ReadNumber(gpu, "Tdp") + 150) * 1.3);
        var psu = PreferInStock(psus.Where(p => ProductSpecs.ReadNumber(p, "Wattage") >= need))
                      .OrderBy(p => p.Price).FirstOrDefault()
                  ?? PreferInStock(psus)
                      .OrderByDescending(p => ProductSpecs.ReadNumber(p, "Wattage")).ThenBy(p => p.Price).FirstOrDefault();

        var parts = new List<Product?>
        {
            gpu, cpu, ram, await Cheapest("stockage"), mobo, psu, await Cheapest("boitier"),
        };
        return parts.Where(p => p is not null).Cast<Product>().ToList();
    }

    /// <summary>
    /// Composant disponible le moins cher qui atteint réellement le seuil recommandé.
    /// Une suggestion d'upgrade trop faible ou hors stock serait trompeuse : dans ce cas, aucun
    /// substitut n'est renvoyé.
    /// </summary>
    public Task<Product?> UpgradeFor(string slug, int recoScore) =>
        _db.Products.Include(product => product.Category)
            .Where(product => product.Category!.Slug == slug
                && product.Stock > 0
                && product.PerfScore >= recoScore)
            .OrderBy(product => product.Price)
            .FirstOrDefaultAsync();
}
