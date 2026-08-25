using System.Security.Cryptography;
using System.Text;
using api.DTOs;
using api.Models;

namespace api.Services;

/// <summary>Conversions entités → DTOs (ne jamais exposer les entités brutes).</summary>
public static class Mapping
{
    /// <summary>Pseudo d'affichage pour un avis : dérivé de l'UserId (stable, non réversible),
    /// jamais de l'email — évite d'exposer la partie locale de l'adresse d'un autre utilisateur.</summary>
    public static string ReviewAuthor(string userId)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(userId));
        return "Client-" + Convert.ToHexString(hash)[..6];
    }

    public static ProductDto ToDto(this Product p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Brand = p.Brand,
        Price = p.Price,
        Stock = p.Stock,
        ImageUrl = p.ImageUrl,
        Description = p.Description,
        PerfScore = p.PerfScore,
        Specs = p.Specs,
        CategoryId = p.CategoryId,
        CategoryName = p.Category?.Name ?? "",
        CategorySlug = p.Category?.Slug ?? "",
        AverageRating = p.Reviews.Count > 0 ? Math.Round(p.Reviews.Average(r => r.Rating), 1) : 0,
        ReviewCount = p.Reviews.Count
    };

    public static CategoryDto ToDto(this Category c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Slug = c.Slug,
        ProductCount = c.Products?.Count ?? 0
    };

    public static GameRequirementDto ToDto(this GameRequirement r) => new()
    {
        Id = r.Id,
        Resolution = r.Resolution,
        TargetFps = r.TargetFps,
        MinGpuScore = r.MinGpuScore,
        RecoGpuScore = r.RecoGpuScore,
        MinCpuScore = r.MinCpuScore,
        RecoCpuScore = r.RecoCpuScore,
        MinRamGb = r.MinRamGb
    };

    public static GameDto ToDto(this Game g) => new()
    {
        Id = g.Id,
        Title = g.Title,
        ImageUrl = g.ImageUrl,
        ReleaseYear = g.ReleaseYear,
        Genre = g.Genre,
        Metacritic = g.Metacritic,
        Requirements = g.Requirements.Select(r => r.ToDto()).ToList()
    };

    public static OrderDto ToDto(this Order o, string? email = null) => new()
    {
        Id = o.Id,
        TotalPrice = o.TotalPrice,
        Status = o.Status.ToString(),
        CreatedAt = o.CreatedAt,
        CustomerEmail = email,
        Items = o.Items.Select(i => new OrderItemDto
        {
            ProductId = i.ProductId,
            ProductName = i.Product?.Name ?? "(supprimé)",
            UnitPrice = i.UnitPrice,
            Quantity = i.Quantity
        }).ToList()
    };

    public static ScoreSummaryDto ToSummary(this ScoreResult s) => new()
    {
        EstimatedFps = s.EstimatedFps,
        GamingPerformance = s.GamingPerformance,
        CpuPower = s.CpuPower,
        VisualQuality = s.VisualQuality,
        BottleneckPenalty = s.BottleneckPenalty,
        PriceValue = s.PriceValue,
        MeetsMinimum = s.MeetsMinimum,
        MeetsRecommended = s.MeetsRecommended,
        Verdict = s.Verdict
    };
}
