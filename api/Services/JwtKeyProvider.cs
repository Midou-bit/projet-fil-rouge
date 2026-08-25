using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace api.Services;

/// <summary>Source UNIQUE de la clé de signature JWT (évite toute divergence entre l'émission
/// du token et sa validation). En Production, une clé absente fait échouer le démarrage plutôt
/// que de signer avec une valeur visible dans le code source.</summary>
public static class JwtKeyProvider
{
    private const string DevFallback = "dev-super-secret-key-change-me-in-prod-please-32+";

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
        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
    }
}
