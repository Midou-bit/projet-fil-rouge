using api.Data;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace api.Health;

/// <summary>Vérifie uniquement que le fournisseur EF peut joindre la base.</summary>
public sealed class DatabaseHealthCheck : IHealthCheck
{
    private readonly AppDbContext _db;

    public DatabaseHealthCheck(AppDbContext db) => _db = db;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return await _db.Database.CanConnectAsync(cancellationToken)
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy();
        }
        catch
        {
            // Ne pas attacher l'exception au rapport : le endpoint public ne doit jamais
            // transporter un chemin SQLite, une chaîne de connexion ou une stack trace.
            return HealthCheckResult.Unhealthy();
        }
    }
}
