using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace api.Services;

/// <summary>Source UNIQUE de la clé de signature JWT (évite toute divergence entre l'émission
/// du token et sa validation). En Production, une clé absente fait échouer le démarrage plutôt
/// que de signer avec une valeur visible dans le code source.</summary>
public static class JwtKeyProvider
{
    private const string DevFallback = "dev-super-secret-key-change-me-in-prod-please-32+";

    private static readonly string[] UnsafeProductionMarkers =
    {
        "change-me",
        "changeme",
        "replace-me",
        "replace_me",
        "replacewith",
        "remplace",
        "dev-super-secret",
    };

    /// <summary>
    /// Valide les paramètres JWT qui doivent être cohérents avant que l'application accepte du trafic.
    /// Aucune valeur de configuration n'est incluse dans les messages d'erreur.
    /// </summary>
    public static void ValidateConfiguration(IConfiguration config)
    {
        var issuer = config["Jwt:Issuer"];
        var audience = config["Jwt:Audience"];
        var expireHours = config["Jwt:ExpireHours"];

        if (string.IsNullOrWhiteSpace(issuer))
            throw new InvalidOperationException("Jwt:Issuer manquant.");
        if (string.IsNullOrWhiteSpace(audience))
            throw new InvalidOperationException("Jwt:Audience manquant.");
        if (!int.TryParse(expireHours, out var hours) || hours is < 1 or > 24)
            throw new InvalidOperationException("Jwt:ExpireHours doit être un entier compris entre 1 et 24.");
    }

    public static SymmetricSecurityKey Resolve(IConfiguration config, IHostEnvironment env)
    {
        var key = config["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(key))
        {
            if (env.IsProduction())
                throw new InvalidOperationException(
                    "Jwt:Key manquant : obligatoire en Production (voir api/appsettings.Development.example.json).");
            key = DevFallback;
        }

        if (env.IsProduction())
        {
            var normalized = key.Trim().ToLowerInvariant();
            var isKnownPlaceholder = UnsafeProductionMarkers.Any(normalized.Contains);
            if (Encoding.UTF8.GetByteCount(key) < 32 || isKnownPlaceholder)
                throw new InvalidOperationException(
                    "Jwt:Key invalide en Production : utiliser une valeur aléatoire d'au moins 32 octets.");
        }

        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
    }
}
