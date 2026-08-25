using System.Net.Http.Headers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace api.Tests;

/// <summary>Héberge l'API réelle (mêmes migrations/seed que Program.cs) sur une base SQLite
/// temporaire, unique par instance de factory — tests isolés, sans toucher à frameforge.db.</summary>
public class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"frameforge-test-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            // Overrides déterministes : la base de test ne doit dépendre ni du frameforge.db du
            // dev, ni de sa config locale (une vraie clé Stripe en Development ferait sortir les
            // tests checkout du mode démo et taper l'API Stripe réelle).
            // NOTE : ne PAS surcharger Jwt:Key ici — Program.cs le lit AVANT que cette config de
            // test ne soit fusionnée (lecture "eager" en top-level statement, contrairement à la
            // connection string lue paresseusement à chaque résolution du DbContext). Signer avec
            // une valeur que la validation ne voit pas encore casserait tous les tests authentifiés.
            // Les deux côtés retombent donc sur le même repli dev (JwtKeyProvider) — cohérent.
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = $"Data Source={_dbPath}",
                ["Stripe:SecretKey"] = "",
                ["Stripe:PublishableKey"] = "",
            });
        });

        builder.ConfigureServices(services =>
        {
            // Empêche tout appel réseau réel vers FreeToGame pendant les tests : l'import échoue
            // immédiatement (comme si on était hors-ligne), Program.cs bascule alors sur le
            // fallback curaté — comportement réel de l'appli, pas un contournement de test.
            services.AddHttpClient(string.Empty)
                .ConfigurePrimaryHttpMessageHandler(() => new OfflineHandler());
        });
    }

    public Task InitializeAsync()
    {
        // Force la création du TestServer maintenant (migrations + seed s'exécutent ici).
        _ = Server;
        return Task.CompletedTask;
    }

    public new Task DisposeAsync()
    {
        base.Dispose();
        foreach (var suffix in new[] { "", "-shm", "-wal" })
        {
            try { File.Delete(_dbPath + suffix); } catch { /* best effort */ }
        }
        return Task.CompletedTask;
    }
}

file class OfflineHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        => throw new HttpRequestException("Réseau désactivé pendant les tests (simulation hors-ligne).");
}

/// <summary>Petits helpers HTTP partagés par les tests d'intégration.</summary>
public static class HttpClientExtensions
{
    public static void Authorize(this HttpClient client, string token) =>
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
}
