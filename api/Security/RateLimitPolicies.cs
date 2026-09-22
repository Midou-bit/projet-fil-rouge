using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace api.Security;

/// <summary>Noms et construction centralisée des politiques anti-abus publiques.</summary>
public static class RateLimitPolicies
{
    public const string Login = "login";
    public const string Register = "register";
    public const string Support = "support";
    public const string Compute = "compute";

    public static RateLimitPartition<string> CreateFixedWindowPartition(
        HttpContext context,
        string policyName,
        int defaultPermitLimit,
        int defaultWindowSeconds)
    {
        var config = context.RequestServices.GetRequiredService<IConfiguration>();
        if (!config.GetValue("RateLimiting:Enabled", true))
            return RateLimitPartition.GetNoLimiter($"{policyName}:disabled");

        var section = config.GetSection($"RateLimiting:Policies:{policyName}");
        var permitLimit = Math.Clamp(section.GetValue("PermitLimit", defaultPermitLimit), 1, 10_000);
        var windowSeconds = Math.Clamp(section.GetValue("WindowSeconds", defaultWindowSeconds), 1, 86_400);
        var remoteAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        return RateLimitPartition.GetFixedWindowLimiter(
            $"{policyName}:{remoteAddress}",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = TimeSpan.FromSeconds(windowSeconds),
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true,
            });
    }

    public static async ValueTask WriteRejectedResponseAsync(
        OnRejectedContext context,
        CancellationToken cancellationToken)
    {
        var response = context.HttpContext.Response;
        response.StatusCode = StatusCodes.Status429TooManyRequests;

        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            var seconds = Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds));
            response.Headers.RetryAfter = seconds.ToString(CultureInfo.InvariantCulture);
        }

        var logger = context.HttpContext.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger("FrameForge.RateLimiting");
        logger.LogWarning(
            "Requête refusée par le rate limiting. Path={Path} TraceId={TraceId}",
            context.HttpContext.Request.Path.Value,
            context.HttpContext.TraceIdentifier);

        await response.WriteAsJsonAsync(
            new { message = "Trop de requêtes. Réessaie dans quelques instants." },
            cancellationToken);
    }
}
