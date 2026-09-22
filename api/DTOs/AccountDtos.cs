namespace api.DTOs;

/// <summary>
/// Copie portable des seules données personnelles rattachées au compte connecté.
/// Ce contrat est volontairement explicite : les champs Identity, identifiants de session
/// de paiement et identifiants d'autres utilisateurs ne peuvent pas être sérialisés par erreur.
/// </summary>
public sealed class AccountExportDto
{
    public DateTime ExportedAtUtc { get; init; }
    public AccountExportProfileDto Account { get; init; } = new();
    public AccountExportCartDto Cart { get; init; } = new();
    public List<AccountExportOrderDto> Orders { get; init; } = new();
    public List<AccountExportReviewDto> Reviews { get; init; } = new();
    public List<AccountExportSupportMessageDto> SupportMessages { get; init; } = new();
}

public sealed class AccountExportProfileDto
{
    public string Email { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public List<string> Roles { get; init; } = new();
}

public sealed class AccountExportCartDto
{
    public List<AccountExportItemDto> Items { get; init; } = new();
    public decimal Total { get; init; }
}

public sealed class AccountExportItemDto
{
    public int ProductId { get; init; }
    public string ProductName { get; init; } = string.Empty;
    public decimal UnitPrice { get; init; }
    public int Quantity { get; init; }
}

public sealed class AccountExportOrderDto
{
    public int Id { get; init; }
    public decimal TotalPrice { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public List<AccountExportItemDto> Items { get; init; } = new();
}

public sealed class AccountExportReviewDto
{
    public int Id { get; init; }
    public int ProductId { get; init; }
    public string ProductName { get; init; } = string.Empty;
    public int Rating { get; init; }
    public string Comment { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}

public sealed class AccountExportSupportMessageDto
{
    public int Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string Subject { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}
