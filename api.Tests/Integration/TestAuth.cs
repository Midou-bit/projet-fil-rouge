using System.Net.Http.Json;
using api.DTOs;

namespace api.Tests.Integration;

/// <summary>Enregistre un client de test frais et retourne un HttpClient authentifié.</summary>
public static class TestAuth
{
    public static async Task<HttpClient> NewAuthedClientAsync(ApiFactory factory, string? emailPrefix = null)
    {
        var client = factory.CreateClient();
        var email = $"{emailPrefix ?? "user"}-{Guid.NewGuid():N}@test.dev";
        var res = await client.PostAsJsonAsync("/api/auth/register", new { email, password = "Passw0rd!Test" });
        res.EnsureSuccessStatusCode();
        var body = await res.Content.ReadFromJsonAsync<AuthResponseDto>();
        client.Authorize(body!.Token);
        return client;
    }

    public static async Task<HttpClient> AdminClientAsync(ApiFactory factory)
    {
        var client = factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/auth/login", new { email = "admin@frameforge.dev", password = "AdminFrame2026!" });
        res.EnsureSuccessStatusCode();
        var body = await res.Content.ReadFromJsonAsync<AuthResponseDto>();
        client.Authorize(body!.Token);
        return client;
    }
}
