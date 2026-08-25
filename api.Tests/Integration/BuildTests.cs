using System.Net;
using System.Net.Http.Json;
using api.DTOs;

namespace api.Tests.Integration;

public class BuildTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    public BuildTests(ApiFactory factory) => _factory = factory;

    /// <summary>L'import des jeux (offline → fallback curaté) tourne en arrière-plan au boot,
    /// comme en prod : on attend qu'il se termine plutôt que de fixer un sleep arbitraire.</summary>
    private static async Task<List<GameDto>> WaitForGamesAsync(HttpClient client)
    {
        var deadline = DateTime.UtcNow.AddSeconds(10);
        while (DateTime.UtcNow < deadline)
        {
            var games = await client.GetFromJsonAsync<List<GameDto>>("/api/games");
            if (games is { Count: > 0 }) return games;
            await Task.Delay(100);
        }
        throw new TimeoutException("Les jeux ne se sont pas peuplés à temps (fallback curaté).");
    }

    [Fact]
    public async Task Games_FallBackToCuratedList_WhenOffline()
    {
        var client = _factory.CreateClient();
        var games = await WaitForGamesAsync(client);
        Assert.Equal(16, games.Count); // les 16 jeux curatés (import réseau désactivé en test)
        Assert.All(games, g => Assert.NotNull(g.Metacritic)); // désormais peuplé (P2.1)
    }

    [Fact]
    public async Task GetBuild_ReturnsFullPartsListAndScore()
    {
        var client = _factory.CreateClient();
        var games = await WaitForGamesAsync(client);
        var game = games[0];

        var build = await client.GetFromJsonAsync<BuildRecommendationDto>($"/api/games/{game.Id}/build?resolution=1080p&fps=60");
        Assert.NotNull(build);
        Assert.True(build!.Parts.Count > 0);
        Assert.Contains(build.Parts, p => p.CategorySlug == "gpu");
        Assert.Contains(build.Parts, p => p.CategorySlug == "cpu");
        Assert.Equal(build.Parts.Sum(p => p.Price), build.TotalPrice);
    }

    [Fact]
    public async Task Check_UnknownGame_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();
        var products = await client.GetFromJsonAsync<PagedResult<ProductDto>>("/api/products?pageSize=5");
        var any = products!.Items.First();

        var res = await client.PostAsJsonAsync("/api/check", new
        {
            cpuId = any.Id,
            gpuId = any.Id,
            gameId = 999_999,
            resolution = "1080p",
            targetFps = 60,
            ramGb = 16,
        });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Check_KnownHardwareAndGame_ReturnsVerdict()
    {
        var client = _factory.CreateClient();
        var games = await WaitForGamesAsync(client);
        var gpu = (await client.GetFromJsonAsync<PagedResult<ProductDto>>("/api/products?category=gpu&sort=perf&pageSize=1"))!.Items.First();
        var cpu = (await client.GetFromJsonAsync<PagedResult<ProductDto>>("/api/products?category=cpu&sort=perf&pageSize=1"))!.Items.First();

        var res = await client.PostAsJsonAsync("/api/check", new
        {
            cpuId = cpu.Id,
            gpuId = gpu.Id,
            gameId = games[0].Id,
            resolution = "1080p",
            targetFps = 60,
            ramGb = 16,
        });
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var result = await res.Content.ReadFromJsonAsync<CheckResultDto>();
        Assert.NotNull(result!.Score.Verdict);
    }

    [Fact]
    public async Task BuildCalc_WithoutGame_ReturnsGenericBars()
    {
        var client = _factory.CreateClient();
        var gpu = (await client.GetFromJsonAsync<PagedResult<ProductDto>>("/api/products?category=gpu&pageSize=1"))!.Items.First();
        var cpu = (await client.GetFromJsonAsync<PagedResult<ProductDto>>("/api/products?category=cpu&pageSize=1"))!.Items.First();

        var res = await client.PostAsJsonAsync("/api/build/calc", new
        {
            productIds = new[] { gpu.Id, cpu.Id },
            gameId = (int?)null,
            resolution = "1080p",
            targetFps = 60,
        });
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var summary = await res.Content.ReadFromJsonAsync<ScoreSummaryDto>();
        Assert.Equal("Build prêt", summary!.Verdict);
    }
}
