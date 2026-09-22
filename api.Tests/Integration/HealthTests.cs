using System.Net;
using System.Net.Http.Json;

namespace api.Tests.Integration;

public class HealthTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public HealthTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Health_ReportsDatabaseWithoutLeakingConfiguration()
    {
        var response = await _factory.CreateClient().GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        var payload = await response.Content.ReadFromJsonAsync<HealthPayload>();
        Assert.NotNull(payload);
        Assert.Equal("Healthy", payload.Status);
        Assert.Equal("Healthy", payload.Checks["database"]);

        var json = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("Data Source", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(".db", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("exception", json, StringComparison.OrdinalIgnoreCase);
    }

    private sealed class HealthPayload
    {
        public string Status { get; init; } = string.Empty;
        public Dictionary<string, string> Checks { get; init; } = new();
    }
}
