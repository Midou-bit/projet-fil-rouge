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
    [Required, StringLength(150, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required, StringLength(80, MinimumLength = 1)]
    public string Brand { get; set; } = string.Empty;

    [Range(typeof(decimal), "0.01", "100000")]
    public decimal Price { get; set; }

    [Range(0, 100000)]
    public int Stock { get; set; }

    [Url, MaxLength(2048)]
    public string? ImageUrl { get; set; }

    [Required, MaxLength(4000)]
    public string Description { get; set; } = string.Empty;

    [Range(0, 100)]
    public int PerfScore { get; set; }

    [MaxLength(8000)]
    public string? Specs { get; set; }

    [Range(1, int.MaxValue)]
    public int CategoryId { get; set; }
}

/// <summary>Filtres bornés du catalogue public.</summary>
public sealed class ProductQueryDto
{
    [MaxLength(150)]
    public string? Search { get; set; }

    [MaxLength(80), RegularExpression("^[a-z0-9-]+$")]
    public string? Category { get; set; }

    [MaxLength(80)]
    public string? Brand { get; set; }

    [Range(typeof(decimal), "0", "100000")]
    public decimal? MinPrice { get; set; }

    [Range(typeof(decimal), "0", "100000")]
    public decimal? MaxPrice { get; set; }

    [Range(0, 100)]
    public int? MinPerf { get; set; }

    [AllowedValues("name", "price_asc", "price_desc", "perf", "newest")]
    public string Sort { get; set; } = "name";

    [Range(1, 100_000)]
    public int Page { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 12;
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
