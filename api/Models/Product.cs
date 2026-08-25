namespace api.Models;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public string? ImageUrl { get; set; }
    public string Description { get; set; } = string.Empty;

    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    /// <summary>Tier interne 0-100 : le chiffre qui pilote le moteur de score.</summary>
    public int PerfScore { get; set; }

    /// <summary>Specs libres au format JSON (Vram, Cores, Frequency, Wattage...).
    /// Affichées sur la fiche produit ; le PerfScore reste la valeur calculée.</summary>
    public string? Specs { get; set; }

    public List<Review> Reviews { get; set; } = new();
}
