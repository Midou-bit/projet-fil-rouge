using System.Net;
using System.Net.Http.Json;
using api.DTOs;

namespace api.Tests.Integration;

public class CartCheckoutTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    public CartCheckoutTests(ApiFactory factory) => _factory = factory;

    private async Task<ProductDto> AnyProductWithStockAsync(HttpClient client, int minStock = 1)
    {
        var page = await client.GetFromJsonAsync<PagedResult<ProductDto>>("/api/products?pageSize=100");
        var product = page!.Items.First(p => p.Stock >= minStock);
        return product;
    }

    [Fact]
    public async Task AddToCart_ExceedingStock_ReturnsBadRequest()
    {
        var client = await TestAuth.NewAuthedClientAsync(_factory, "cart-oversell");
        var product = await AnyProductWithStockAsync(client);

        var res = await client.PostAsJsonAsync("/api/cart/items", new { productId = product.Id, quantity = product.Stock + 100 });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task AddToCart_ThenGet_ReflectsItem()
    {
        var client = await TestAuth.NewAuthedClientAsync(_factory, "cart-add");
        var product = await AnyProductWithStockAsync(client);

        var add = await client.PostAsJsonAsync("/api/cart/items", new { productId = product.Id, quantity = 1 });
        Assert.Equal(HttpStatusCode.OK, add.StatusCode);

        var cart = await client.GetFromJsonAsync<CartDto>("/api/cart");
        Assert.Contains(cart!.Items, i => i.ProductId == product.Id);
    }

    [Fact]
    public async Task Checkout_DemoMode_PaysImmediatelyAndDecrementsStock()
    {
        var client = await TestAuth.NewAuthedClientAsync(_factory, "checkout-demo");
        var product = await AnyProductWithStockAsync(client);
        var stockBefore = product.Stock;

        await client.PostAsJsonAsync("/api/cart/items", new { productId = product.Id, quantity = 1 });

        var checkout = await client.PostAsync("/api/checkout", content: null);
        Assert.Equal(HttpStatusCode.OK, checkout.StatusCode);
        var body = await checkout.Content.ReadFromJsonAsync<CheckoutResponseDto>();
        Assert.True(body!.Simulated);

        var orders = await client.GetFromJsonAsync<List<OrderDto>>("/api/orders");
        var order = orders!.Single(o => o.Id == body.OrderId);
        Assert.Equal("Paid", order.Status);

        var after = await client.GetFromJsonAsync<ProductDto>($"/api/products/{product.Id}");
        Assert.Equal(stockBefore - 1, after!.Stock);

        // Le panier doit être vidé après confirmation.
        var cart = await client.GetFromJsonAsync<CartDto>("/api/cart");
        Assert.Empty(cart!.Items);
    }

    [Fact]
    public async Task Checkout_EmptyCart_ReturnsBadRequest()
    {
        var client = await TestAuth.NewAuthedClientAsync(_factory, "checkout-empty");
        var res = await client.PostAsync("/api/checkout", content: null);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Confirm_AlreadyPaidOrder_IsIdempotent()
    {
        var client = await TestAuth.NewAuthedClientAsync(_factory, "checkout-idempotent");
        var product = await AnyProductWithStockAsync(client);
        await client.PostAsJsonAsync("/api/cart/items", new { productId = product.Id, quantity = 1 });

        var checkout = await client.PostAsync("/api/checkout", content: null);
        var body = await checkout.Content.ReadFromJsonAsync<CheckoutResponseDto>();

        // Reconfirmer une commande déjà payée ne doit ni échouer ni re-décrémenter le stock.
        var stockAfterFirst = (await client.GetFromJsonAsync<ProductDto>($"/api/products/{product.Id}"))!.Stock;
        var reconfirm = await client.PostAsync($"/api/checkout/confirm/{body!.OrderId}", content: null);
        Assert.Equal(HttpStatusCode.OK, reconfirm.StatusCode);
        var stockAfterSecond = (await client.GetFromJsonAsync<ProductDto>($"/api/products/{product.Id}"))!.Stock;
        Assert.Equal(stockAfterFirst, stockAfterSecond);
    }

    [Fact]
    public async Task Orders_AreScopedToOwner()
    {
        var owner = await TestAuth.NewAuthedClientAsync(_factory, "order-owner");
        var product = await AnyProductWithStockAsync(owner);
        await owner.PostAsJsonAsync("/api/cart/items", new { productId = product.Id, quantity = 1 });
        var checkout = await owner.PostAsync("/api/checkout", content: null);
        var body = await checkout.Content.ReadFromJsonAsync<CheckoutResponseDto>();

        var stranger = await TestAuth.NewAuthedClientAsync(_factory, "order-stranger");
        var res = await stranger.GetAsync($"/api/orders/{body!.OrderId}");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }
}
