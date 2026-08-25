using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public string? ImageUrl { get; set; }
    public string Description { get; set; } = string.Empty;
    public int PerfScore { get; set; }
    public string? Specs { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategorySlug { get; set; } = string.Empty;
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
}

public class ProductWriteDto
{
    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string Brand { get; set; } = string.Empty;

    [Range(0, 100000)]
    public decimal Price { get; set; }

    [Range(0, 100000)]
    public int Stock { get; set; }

    public string? ImageUrl { get; set; }
    public string Description { get; set; } = string.Empty;

    [Range(0, 100)]
    public int PerfScore { get; set; }

    public string? Specs { get; set; }

    [Required]
    public int CategoryId { get; set; }
}

/// <summary>Réponse paginée pour le catalogue.</summary>
public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)Total / PageSize) : 0;
}
