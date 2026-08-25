using System.Net;
using System.Net.Http.Json;
using api.DTOs;

namespace api.Tests.Integration;

public class AuthTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    public AuthTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Register_Then_Login_Succeeds()
    {
        var client = _factory.CreateClient();
        var email = $"user-{Guid.NewGuid():N}@test.dev";

        var register = await client.PostAsJsonAsync("/api/auth/register", new { email, password = "Passw0rd!Test" });
        Assert.Equal(HttpStatusCode.OK, register.StatusCode);
        var registerBody = await register.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.False(string.IsNullOrWhiteSpace(registerBody!.Token));
        Assert.Equal("Client", registerBody.Role);

        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "Passw0rd!Test" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsConflict()
    {
        var client = _factory.CreateClient();
        var email = $"dup-{Guid.NewGuid():N}@test.dev";

        var first = await client.PostAsJsonAsync("/api/auth/register", new { email, password = "Passw0rd!Test" });
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await client.PostAsJsonAsync("/api/auth/register", new { email, password = "Passw0rd!Test" });
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Login_WrongPassword_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var email = $"wrongpw-{Guid.NewGuid():N}@test.dev";
        await client.PostAsJsonAsync("/api/auth/register", new { email, password = "Passw0rd!Test" });

        var res = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "NotThePassword1!" });
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task SeededDemoAccounts_CanLogIn()
    {
        var client = _factory.CreateClient();
        var admin = await client.PostAsJsonAsync("/api/auth/login", new { email = "admin@frameforge.dev", password = "AdminFrame2026!" });
        Assert.Equal(HttpStatusCode.OK, admin.StatusCode);
        var adminBody = await admin.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.Equal("Admin", adminBody!.Role);

        var client2 = _factory.CreateClient();
        var user = await client2.PostAsJsonAsync("/api/auth/login", new { email = "client@frameforge.dev", password = "ClientFrame2026!" });
        Assert.Equal(HttpStatusCode.OK, user.StatusCode);
    }
}
