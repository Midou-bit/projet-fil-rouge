using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

public class ReviewDto
{
    public int Id { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateReviewDto
{
    [Required] public int ProductId { get; set; }
    [Range(1, 5)] public int Rating { get; set; }
    [Required, MinLength(1), MaxLength(1000)] public string Comment { get; set; } = string.Empty;
}

public class CreateSupportDto
{
    [Required, EmailAddress] public string Email { get; set; } = string.Empty;
    [Required, MaxLength(150)] public string Subject { get; set; } = string.Empty;
    [Required, MaxLength(2000)] public string Message { get; set; } = string.Empty;
}

public class SupportMessageDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CheckoutResponseDto
{
    public string? CheckoutUrl { get; set; }
    public int OrderId { get; set; }
    /// <summary>True quand Stripe n'est pas configuré : on simule le paiement (mode démo).</summary>
    public bool Simulated { get; set; }
}

public class AdminStatsDto
{
    public int TotalProducts { get; set; }
    public int TotalOrders { get; set; }
    public int TotalUsers { get; set; }
    public decimal Revenue { get; set; }
    public int PendingSupport { get; set; }
    public List<TopProductDto> TopProducts { get; set; } = new();
}

public class TopProductDto
{
    public string Name { get; set; } = string.Empty;
    public int QuantitySold { get; set; }
    public decimal Revenue { get; set; }
}
