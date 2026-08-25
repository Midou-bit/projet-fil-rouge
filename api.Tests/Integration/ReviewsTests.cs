using System.Net;
using System.Net.Http.Json;
using api.DTOs;

namespace api.Tests.Integration;

public class ReviewsTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    public ReviewsTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Create_WithoutPurchase_ReturnsBadRequest()
    {
        var client = await TestAuth.NewAuthedClientAsync(_factory, "review-no-purchase");
        var product = (await client.GetFromJsonAsync<PagedResult<ProductDto>>("/api/products?pageSize=1"))!.Items.First();

        var res = await client.PostAsJsonAsync("/api/reviews", new { productId = product.Id, rating = 5, comment = "Top !" });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Create_AfterPurchase_Succeeds_AndAuthorIsNotEmail()
    {
        var client = await TestAuth.NewAuthedClientAsync(_factory, "review-after-purchase");
        var product = (await client.GetFromJsonAsync<PagedResult<ProductDto>>("/api/products?pageSize=1"))!.Items.First();

        await client.PostAsJsonAsync("/api/cart/items", new { productId = product.Id, quantity = 1 });
        var checkout = await client.PostAsync("/api/checkout", content: null);
        checkout.EnsureSuccessStatusCode();

        var res = await client.PostAsJsonAsync("/api/reviews", new { productId = product.Id, rating = 5, comment = "Top !" });
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var review = await res.Content.ReadFromJsonAsync<ReviewDto>();
        Assert.StartsWith("Client-", review!.Author);
        Assert.DoesNotContain("review-after-purchase", review.Author);
    }
}
