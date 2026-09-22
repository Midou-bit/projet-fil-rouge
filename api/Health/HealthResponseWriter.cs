using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace api.Health;

public static class HealthResponseWriter
{
    public static Task WriteAsync(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.Headers.CacheControl = "no-store";

        // Réponse volontairement minimale : aucun message d'exception, chemin système,
        // temps de requête ou détail de configuration n'est exposé publiquement.
        return context.Response.WriteAsJsonAsync(new
        {
            status = report.Status.ToString(),
            checks = report.Entries.ToDictionary(
                entry => entry.Key,
                entry => entry.Value.Status.ToString()),
        });
    }
}
