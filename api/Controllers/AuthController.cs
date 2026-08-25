using api.DTOs;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly SignInManager<ApplicationUser> _signIn;
    private readonly TokenService _tokens;

    public AuthController(UserManager<ApplicationUser> users, SignInManager<ApplicationUser> signIn, TokenService tokens)
    {
        _users = users;
        _signIn = signIn;
        _tokens = tokens;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
    {
        if (await _users.FindByEmailAsync(dto.Email) is not null)
            return Conflict(new { message = "Un compte existe déjà avec cet email." });

        var user = new ApplicationUser { UserName = dto.Email, Email = dto.Email };
        var result = await _users.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        await _users.AddToRoleAsync(user, Roles.Client);
        return await BuildResponse(user);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var user = await _users.FindByEmailAsync(dto.Email);
        if (user is null)
            return Unauthorized(new { message = "Email ou mot de passe incorrect." });

        // lockoutOnFailure: true → verrouille le compte après N échecs (anti-bruteforce, cf. Program.cs).
        var result = await _signIn.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: true);
        if (result.IsLockedOut)
            return Unauthorized(new { message = "Compte temporairement verrouillé suite à plusieurs échecs. Réessaie dans quelques minutes." });
        if (!result.Succeeded)
            return Unauthorized(new { message = "Email ou mot de passe incorrect." });

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
