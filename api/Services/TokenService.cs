using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using api.Models;
using Microsoft.IdentityModel.Tokens;

namespace api.Services;

public class TokenService
{
    private readonly IConfiguration _config;
    private readonly IHostEnvironment _env;
    public TokenService(IConfiguration config, IHostEnvironment env)
    {
        _config = config;
        _env = env;
    }

    public string CreateToken(ApplicationUser user, IList<string> roles)
    {
        var jwt = _config.GetSection("Jwt");
        var key = JwtKeyProvider.Resolve(_config, _env);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new(ClaimTypes.NameIdentifier, user.Id),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expireHours = int.TryParse(jwt["ExpireHours"], out var h) ? h : 12;

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expireHours),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
