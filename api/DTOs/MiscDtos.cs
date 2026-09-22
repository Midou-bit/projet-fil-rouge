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
    [Range(1, int.MaxValue)] public int ProductId { get; set; }
    [Range(1, 5)] public int Rating { get; set; }
    [Required, StringLength(1000, MinimumLength = 1)] public string Comment { get; set; } = string.Empty;
}

public class CreateSupportDto
{
    [Required, EmailAddress, StringLength(254)] public string Email { get; set; } = string.Empty;
    [Required, StringLength(150, MinimumLength = 3)] public string Subject { get; set; } = string.Empty;
    [Required, StringLength(2000, MinimumLength = 10)] public string Message { get; set; } = string.Empty;
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
    /// <summary>Mode décidé par le serveur : "simulation" ou "stripe_test".</summary>
    public string PaymentMode { get; set; } = string.Empty;
}

public class CheckoutConfirmationDto
{
    public string Status { get; set; } = string.Empty;
    public string PaymentMode { get; set; } = string.Empty;
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
