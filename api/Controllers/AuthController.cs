using api.DTOs;
using api.Models;
using api.Security;
using api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly SignInManager<ApplicationUser> _signIn;
    private readonly TokenService _tokens;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> users,
        SignInManager<ApplicationUser> signIn,
        TokenService tokens,
        ILogger<AuthController> logger)
    {
        _users = users;
        _signIn = signIn;
        _tokens = tokens;
        _logger = logger;
    }

    [HttpPost("register")]
    [EnableRateLimiting(RateLimitPolicies.Register)]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
    {
        if (await _users.FindByEmailAsync(dto.Email) is not null)
        {
            _logger.LogWarning(
                "Inscription refusée : compte déjà existant. TraceId={TraceId}",
                HttpContext.TraceIdentifier);
            return Conflict(new { message = "Un compte existe déjà avec cet email." });
        }

        var user = new ApplicationUser { UserName = dto.Email, Email = dto.Email };
        var result = await _users.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            _logger.LogWarning(
                "Inscription refusée par Identity. ErrorCount={ErrorCount} TraceId={TraceId}",
                result.Errors.Count(),
                HttpContext.TraceIdentifier);
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        var roleResult = await _users.AddToRoleAsync(user, Roles.Client);
        if (!roleResult.Succeeded)
        {
            // Ne pas laisser derrière nous un compte authentifiable mais privé de rôle.
            await _users.DeleteAsync(user);
            _logger.LogError(
                "Inscription annulée : attribution de rôle impossible. ErrorCount={ErrorCount} TraceId={TraceId}",
                roleResult.Errors.Count(),
                HttpContext.TraceIdentifier);
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new { message = "L'inscription n'a pas pu être finalisée." });
        }

        _logger.LogInformation("Inscription réussie. TraceId={TraceId}", HttpContext.TraceIdentifier);
        return await BuildResponse(user);
    }

    [HttpPost("login")]
    [EnableRateLimiting(RateLimitPolicies.Login)]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var user = await _users.FindByEmailAsync(dto.Email);
        if (user is null)
        {
            _logger.LogWarning(
                "Connexion refusée : identifiants invalides. TraceId={TraceId}",
                HttpContext.TraceIdentifier);
            return Unauthorized(new { message = "Email ou mot de passe incorrect." });
        }

        // lockoutOnFailure: true → verrouille le compte après N échecs (anti-bruteforce, cf. Program.cs).
        var result = await _signIn.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: true);
        if (result.IsLockedOut)
        {
            _logger.LogWarning(
                "Connexion refusée : compte verrouillé. TraceId={TraceId}",
                HttpContext.TraceIdentifier);
            return Unauthorized(new { message = "Compte temporairement verrouillé suite à plusieurs échecs. Réessaie dans quelques minutes." });
        }
        if (!result.Succeeded)
        {
            _logger.LogWarning(
                "Connexion refusée : identifiants invalides. TraceId={TraceId}",
                HttpContext.TraceIdentifier);
            return Unauthorized(new { message = "Email ou mot de passe incorrect." });
        }

        _logger.LogInformation("Connexion réussie. TraceId={TraceId}", HttpContext.TraceIdentifier);
        return await BuildResponse(user);
    }

    private async Task<ActionResult<AuthResponseDto>> BuildResponse(ApplicationUser user)
    {
        var roles = await _users.GetRolesAsync(user);
        return Ok(new AuthResponseDto
        {
            Token = _tokens.CreateToken(user, roles),
            Email = user.Email ?? "",
            Role = roles.FirstOrDefault() ?? Roles.Client
        });
    }
}
