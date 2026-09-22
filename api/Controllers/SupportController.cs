using System.Security.Claims;
using api.Data;
using api.DTOs;
using api.Models;
using api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api")]
public class SupportController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<SupportController> _logger;

    public SupportController(AppDbContext db, ILogger<SupportController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>Formulaire de contact — ouvert (visiteur connecté ou non).</summary>
    [HttpPost("support")]
    [EnableRateLimiting(RateLimitPolicies.Support)]
    public async Task<IActionResult> Create(CreateSupportDto dto)
    {
        var msg = new SupportMessage
        {
            Email = dto.Email,
            Subject = dto.Subject,
            Message = dto.Message,
            UserId = User.FindFirstValue(ClaimTypes.NameIdentifier)
        };
        _db.SupportMessages.Add(msg);
        await _db.SaveChangesAsync();
        _logger.LogInformation(
            "Message support enregistré. Authenticated={Authenticated} TraceId={TraceId}",
            User.Identity?.IsAuthenticated == true,
            HttpContext.TraceIdentifier);
        return Ok(new { message = "Message envoyé. Notre équipe vous répondra rapidement." });
    }

    [HttpGet("admin/support")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<IEnumerable<SupportMessageDto>>> All()
    {
        var msgs = await _db.SupportMessages
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new SupportMessageDto
            {
                Id = m.Id,
                Email = m.Email,
                Subject = m.Subject,
                Message = m.Message,
                Status = m.Status.ToString(),
                CreatedAt = m.CreatedAt
            }).ToListAsync();
        return Ok(msgs);
    }

    [HttpPut("admin/support/{id:int}/answered")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> MarkAnswered(int id)
    {
        var m = await _db.SupportMessages.FindAsync(id);
        if (m is null) return NotFound();
        m.Status = SupportStatus.Answered;
        await _db.SaveChangesAsync();
        _logger.LogInformation(
            "Message support marqué comme traité. TraceId={TraceId}",
            HttpContext.TraceIdentifier);
        return Ok(new { status = m.Status.ToString() });
    }
}
