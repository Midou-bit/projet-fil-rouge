using System.Text.Json;
using api.Models;

namespace api.Services;

/// <summary>Lecture tolérante des spécifications JSON libres du catalogue.</summary>
public static class ProductSpecs
{
    public static string? Read(Product? product, string key)
    {
        if (string.IsNullOrWhiteSpace(product?.Specs)) return null;

        try
        {
            using var doc = JsonDocument.Parse(product.Specs);
            return doc.RootElement.TryGetProperty(key, out var value)
                ? value.ValueKind == JsonValueKind.String ? value.GetString() : value.ToString()
                : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// <summary>Retourne le premier entier d'une valeur telle que "32 Go" ou "575W".</summary>
    public static int ReadNumber(Product? product, string key)
    {
        var value = Read(product, key);
        if (string.IsNullOrWhiteSpace(value)) return 0;

        var digits = new string(value.SkipWhile(c => !char.IsDigit(c)).TakeWhile(char.IsDigit).ToArray());
        return int.TryParse(digits, out var number) ? number : 0;
    }
}
