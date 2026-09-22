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

    [Fact]
    public async Task Stats_RevenueCountsPaidAndShippedButNotCancelledOrders()
    {
        var admin = await TestAuth.AdminClientAsync(_factory);
        var before = await admin.GetFromJsonAsync<AdminStatsDto>("/api/admin/stats");
        var customer = await TestAuth.NewAuthedClientAsync(_factory, "stats-statuses");
        var products = await customer.GetFromJsonAsync<PagedResult<ProductDto>>("/api/products?pageSize=100");
        var product = products!.Items.First(p => p.Stock >= 2);

        await customer.PostAsJsonAsync("/api/cart/items", new { productId = product.Id, quantity = 1 });
        var cancelledCheckout = await customer.PostAsync("/api/checkout", content: null);
        var cancelled = await cancelledCheckout.Content.ReadFromJsonAsync<CheckoutResponseDto>();
        await customer.PostAsync($"/api/orders/{cancelled!.OrderId}/cancel", content: null);

        // Le panier n'a pas été consommé par l'annulation : une seconde commande peut être
        // créée puis confirmée par le serveur en mode démonstration.
        var paidCheckout = await customer.PostAsync("/api/checkout", content: null);
        var paid = await paidCheckout.Content.ReadFromJsonAsync<CheckoutResponseDto>();
        var confirmation = await customer.PostAsync($"/api/checkout/confirm/{paid!.OrderId}", content: null);
        Assert.Equal(HttpStatusCode.OK, confirmation.StatusCode);

        var afterPaid = await admin.GetFromJsonAsync<AdminStatsDto>("/api/admin/stats");
        Assert.Equal(before!.TotalOrders + 2, afterPaid!.TotalOrders);
        Assert.Equal(before.Revenue + product.Price, afterPaid.Revenue);

        var shipped = await admin.PutAsJsonAsync($"/api/admin/orders/{paid.OrderId}/status", new { status = "Shipped" });
        Assert.Equal(HttpStatusCode.OK, shipped.StatusCode);
        var afterShipped = await admin.GetFromJsonAsync<AdminStatsDto>("/api/admin/stats");
        Assert.Equal(afterPaid.Revenue, afterShipped!.Revenue);
    }
}
