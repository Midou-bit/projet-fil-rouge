using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace api.Tests.Integration;

public sealed class RateLimitedApiFactory : ApiFactory
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["RateLimiting:Enabled"] = "true",
                ["RateLimiting:Policies:login:PermitLimit"] = "2",
                ["RateLimiting:Policies:login:WindowSeconds"] = "60",
            });
        });
    }
}

public class RateLimitingTests : IClassFixture<RateLimitedApiFactory>
{
    private readonly RateLimitedApiFactory _factory;

    public RateLimitingTests(RateLimitedApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Login_RejectsRequestsBeyondConfiguredWindow()
    {
        var client = _factory.CreateClient();
        var payload = new { email = "missing-rate-limit@test.dev", password = "WrongPassw0rd!" };

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await client.PostAsJsonAsync("/api/auth/login", payload)).StatusCode);
        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await client.PostAsJsonAsync("/api/auth/login", payload)).StatusCode);

        var rejected = await client.PostAsJsonAsync("/api/auth/login", payload);
        Assert.Equal(HttpStatusCode.TooManyRequests, rejected.StatusCode);
        Assert.Contains(
            "Trop de requêtes",
            await rejected.Content.ReadAsStringAsync(),
            StringComparison.OrdinalIgnoreCase);
    }
}
