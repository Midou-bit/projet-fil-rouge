using System.Net;
using System.Net.Http.Json;
using api.DTOs;

namespace api.Tests.Integration;

public class AdminTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    public AdminTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Stats_Anonymous_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync("/api/admin/stats");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Stats_RegularClient_ReturnsForbidden()
    {
        var client = await TestAuth.NewAuthedClientAsync(_factory, "not-admin");
        var res = await client.GetAsync("/api/admin/stats");
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task Stats_Admin_ReturnsOk()
    {
        var client = await TestAuth.AdminClientAsync(_factory);
        var res = await client.GetAsync("/api/admin/stats");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var stats = await res.Content.ReadFromJsonAsync<AdminStatsDto>();
        Assert.True(stats!.TotalProducts > 0);
    }

    [Fact]
    public async Task ProductCreate_RegularClient_ReturnsForbidden()
    {
        var client = await TestAuth.NewAuthedClientAsync(_factory, "cant-create-product");
        var res = await client.PostAsJsonAsync("/api/products", new
        {
            name = "Test", brand = "Test", price = 10, stock = 1, description = "x", perfScore = 10, categoryId = 1,
        });
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }
}
