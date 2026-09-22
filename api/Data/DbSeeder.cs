using System.Text.Json;
using api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace api.Data;

public static class DbSeeder
{
    /// <summary>Seed bloquant (rapide) : rôles, comptes, composants. Les jeux sont importés
    /// en arrière-plan (Program.cs) pour ne pas bloquer le démarrage.</summary>
    public static async Task<bool> SeedAsync(IServiceProvider sp)
    {
        var db = sp.GetRequiredService<AppDbContext>();
        var userMgr = sp.GetRequiredService<UserManager<ApplicationUser>>();
        var roleMgr = sp.GetRequiredService<RoleManager<IdentityRole>>();

        await SeedRolesAndUsersAsync(roleMgr, userMgr);
        return await SeedCatalogAsync(db);
    }

    private static async Task SeedRolesAndUsersAsync(
        RoleManager<IdentityRole> roleMgr, UserManager<ApplicationUser> userMgr)
    {
        foreach (var role in new[] { Roles.Admin, Roles.Client })
            if (!await roleMgr.RoleExistsAsync(role))
                await roleMgr.CreateAsync(new IdentityRole(role));

        // Mots de passe démo conformes à la politique applicative (12+ car., 4 types).
        await EnsureUser(userMgr, "admin@frameforge.dev", "AdminFrame2026!", Roles.Admin);
        await EnsureUser(userMgr, "client@frameforge.dev", "ClientFrame2026!", Roles.Client);
    }

    private static async Task EnsureUser(
        UserManager<ApplicationUser> mgr, string email, string password, string role)
    {
        if (await mgr.FindByEmailAsync(email) is not null) return;
        var user = new ApplicationUser { UserName = email, Email = email, EmailConfirmed = true };
        var res = await mgr.CreateAsync(user, password);
        if (res.Succeeded) await mgr.AddToRoleAsync(user, role);
    }

    /// <summary>Catégories + composants chargés depuis Data/seed-components.json (données réelles
    /// issues du dataset docyx, transformées hors-ligne : vrais noms/prix/specs, PerfScore + specs
    /// de compatibilité dérivés). Visuel : vraie photo eBay si présente dans le seed (récupérée
    /// hors-ligne via tools/fetch-ebay-images.py), sinon photo Wikimedia représentative
    /// (ComponentImages), sinon tuile générée on-brand côté front (MediaImage).</summary>
    private static async Task<bool> SeedCatalogAsync(AppDbContext db)
    {
        if (await db.Categories.AnyAsync()) return false;

        var cats = new Dictionary<string, Category>
        {
            ["gpu"] = new() { Name = "Carte graphique", Slug = "gpu" },
            ["cpu"] = new() { Name = "Processeur", Slug = "cpu" },
            ["ram"] = new() { Name = "Mémoire RAM", Slug = "ram" },
            ["stockage"] = new() { Name = "Stockage", Slug = "stockage" },
            ["carte-mere"] = new() { Name = "Carte mère", Slug = "carte-mere" },
            ["alimentation"] = new() { Name = "Alimentation", Slug = "alimentation" },
            ["boitier"] = new() { Name = "Boîtier", Slug = "boitier" },
        };
        db.Categories.AddRange(cats.Values);
        await db.SaveChangesAsync();

        var json = await ReadEmbeddedAsync("seed-components.json");
        var items = json is null
            ? new()
            : JsonSerializer.Deserialize<List<SeedItem>>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();

        var products = items
            .Where(i => cats.ContainsKey(i.Slug))
            .Select(i => new Product
            {
                Category = cats[i.Slug],
                Name = i.Name,
                Brand = i.Brand,
                Price = i.Price,
                Stock = i.Stock,
                PerfScore = i.Perf,
                // Priorité : vraie image eBay (champ JSON) → sinon photo Wikimedia représentative
                // (ComponentImages) → sinon null = visuel généré on-brand côté front.
                ImageUrl = i.ImageUrl ?? ComponentImages.For(i.Slug, i.Brand, i.Name),
                Specs = i.Specs,
                Description = i.Description,
            })
            .ToList();

        db.Products.AddRange(products);
        await db.SaveChangesAsync();
        return true;
    }

    /// <summary>Lit une ressource embarquée (par suffixe de nom) ; null si absente.</summary>
    private static async Task<string?> ReadEmbeddedAsync(string suffix)
    {
        var asm = typeof(DbSeeder).Assembly;
        var name = asm.GetManifestResourceNames().FirstOrDefault(n => n.EndsWith(suffix, StringComparison.OrdinalIgnoreCase));
        if (name is null) return null;
        await using var stream = asm.GetManifestResourceStream(name);
        if (stream is null) return null;
        using var reader = new StreamReader(stream);
        return await reader.ReadToEndAsync();
    }

    /// <summary>Schéma d'un composant dans seed-components.json.</summary>
    private sealed class SeedItem
    {
        public string Slug { get; set; } = "";
        public string Name { get; set; } = "";
        public string Brand { get; set; } = "";
        public decimal Price { get; set; }
        public int Perf { get; set; }
        public int Stock { get; set; }
        public string Specs { get; set; } = "{}";
        public string Description { get; set; } = "";
        public string? ImageUrl { get; set; }
    }

    /// <summary>Fallback OFFLINE : 16 jeux curatés. Appelé en arrière-plan si FreeToGame échoue (hors-ligne).</summary>
    public static async Task SeedCuratedGamesAsync(AppDbContext db)
    {
        if (await db.Games.AnyAsync()) return;

        // (titre, année, baseGpu @1080p/60, baseCpu, minRamGb, Metacritic PC approximatif) —
        // jaquettes en placeholder local. Notes indicatives (arrondies, source publique).
        var defs = new (string Title, int Year, int Gpu, int Cpu, int Ram, int Meta)[]
        {
            ("Cyberpunk 2077", 2020, 80, 70, 16, 86),
            ("Alan Wake 2", 2023, 85, 72, 16, 89),
            ("Starfield", 2023, 75, 80, 16, 83),
            ("Red Dead Redemption 2", 2018, 70, 68, 12, 96),
            ("Hogwarts Legacy", 2023, 72, 70, 16, 84),
            ("Microsoft Flight Simulator", 2020, 78, 85, 16, 90),
            ("Baldur's Gate 3", 2023, 60, 75, 16, 96),
            ("Elden Ring", 2022, 58, 60, 12, 94),
            ("The Witcher 3 (Next-Gen)", 2022, 62, 58, 8, 92),
            ("Forza Horizon 5", 2021, 55, 62, 16, 92),
            ("Call of Duty: MW III", 2023, 65, 68, 16, 84),
            ("Assassin's Creed Mirage", 2023, 60, 64, 16, 75),
            ("Apex Legends", 2019, 45, 55, 8, 88),
            ("Fortnite", 2017, 40, 50, 8, 78),
            ("Counter-Strike 2", 2023, 38, 52, 8, 81),
            ("Valorant", 2020, 25, 35, 8, 80),
        };

        // Chaque couple résolution/FPS possède ses propres seuils. ScoringService les utilise
        // directement : aucun second facteur de résolution n'est appliqué lors de l'estimation.
        var resMult = new Dictionary<string, double> { ["1080p"] = 1.0, ["1440p"] = 1.1, ["4K"] = 1.25 };
        var fpsMult = new Dictionary<int, double> { [60] = 1.0, [144] = 1.4 };

        foreach (var d in defs)
        {
            var game = new Game { Title = d.Title, ReleaseYear = d.Year, Metacritic = d.Meta };
            foreach (var (res, rMul) in resMult)
            foreach (var (fps, fMul) in fpsMult)
            {
                int recoGpu = Math.Clamp((int)Math.Round(d.Gpu * rMul * fMul), 10, 100);
                int recoCpu = Math.Clamp((int)Math.Round(d.Cpu * fMul), 10, 100);
                game.Requirements.Add(new GameRequirement
                {
                    Resolution = res,
                    TargetFps = fps,
                    RecoGpuScore = recoGpu,
                    MinGpuScore = (int)Math.Round(recoGpu * 0.6),
                    RecoCpuScore = recoCpu,
                    MinCpuScore = (int)Math.Round(recoCpu * 0.6),
                    MinRamGb = d.Ram
                });
            }
            db.Games.Add(game);
        }
        await db.SaveChangesAsync();
    }
}
