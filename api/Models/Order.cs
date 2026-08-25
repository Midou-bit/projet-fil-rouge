namespace api.Models;

public enum OrderStatus
{
    Pending,
    Paid,
    Shipped,
    Cancelled
}

public class Order
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    public decimal TotalPrice { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Identifiant de la session Stripe test (pour réconciliation).</summary>
    public string? StripeSessionId { get; set; }

    public List<OrderItem> Items { get; set; } = new();
}

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order? Order { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
}
