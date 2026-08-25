namespace api.Models;

public enum SupportStatus
{
    Open,
    Answered
}

public class SupportMessage
{
    public int Id { get; set; }

    /// <summary>Null si le message vient d'un visiteur non connecté.</summary>
    public string? UserId { get; set; }
    public ApplicationUser? User { get; set; }

    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public SupportStatus Status { get; set; } = SupportStatus.Open;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
