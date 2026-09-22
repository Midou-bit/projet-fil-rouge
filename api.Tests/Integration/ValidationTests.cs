using System.Net;
using System.Net.Http.Json;
using api.Data;
using api.DTOs;
using api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace api.Tests.Integration;

public class ValidationTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public ValidationTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Auth_RejectsInvalidEmailAndPasswordLengths()
    {
        var client = _factory.CreateClient();

        var shortPassword = await client.PostAsJsonAsync(
            "/api/auth/register",
            new { email = "valid@test.dev", password = "Short1!" });
        Assert.Equal(HttpStatusCode.BadRequest, shortPassword.StatusCode);

        var oversizedEmail = new string('a', 246) + "@test.dev";
        var longEmail = await client.PostAsJsonAsync(
            "/api/auth/register",
            new { email = oversizedEmail, password = "Passw0rd!Test" });
        Assert.Equal(HttpStatusCode.BadRequest, longEmail.StatusCode);

        var oversizedPassword = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email = "valid@test.dev", password = new string('x', 129) });
        Assert.Equal(HttpStatusCode.BadRequest, oversizedPassword.StatusCode);
    }

    [Theory]
    [InlineData("?page=0")]
    [InlineData("?pageSize=0")]
    [InlineData("?minPrice=-1")]
    [InlineData("?minPerf=101")]
    [InlineData("?sort=unknown")]
    [InlineData("?category=INVALID_CATEGORY")]
    [InlineData("?minPrice=100&maxPrice=10")]
    public async Task ProductQuery_RejectsOutOfRangeOrUnsupportedFilters(string query)
    {
        var response = await _factory.CreateClient().GetAsync("/api/products" + query);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ProductWrite_RejectsInvalidPriceUrlDescriptionAndCategory()
    {
        var admin = await TestAuth.AdminClientAsync(_factory);

        var response = await admin.PostAsJsonAsync(
            "/api/products",
            new
            {
                name = "X",
                brand = "Test",
                price = 0,
                stock = 1,
                imageUrl = "javascript:alert(1)",
                description = "",
                perfScore = 10,
                categoryId = 0,
            });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CartReviewAndSupport_RejectInvalidPayloads()
    {
        var client = await TestAuth.NewAuthedClientAsync(_factory, "validation");

        Assert.Equal(
            HttpStatusCode.BadRequest,
            (await client.PostAsJsonAsync(
                "/api/cart/items",
                new { productId = 0, quantity = 1 })).StatusCode);
        Assert.Equal(
            HttpStatusCode.BadRequest,
            (await client.PostAsJsonAsync(
                "/api/reviews",
                new { productId = 0, rating = 6, comment = "x" })).StatusCode);
        Assert.Equal(
            HttpStatusCode.BadRequest,
            (await client.PostAsJsonAsync(
                "/api/support",
                new
                {
                    email = new string('a', 246) + "@test.dev",
                    subject = "x",
                    message = "court",
                })).StatusCode);
    }

    [Theory]
    [InlineData("1")]
    [InlineData("999")]
    [InlineData("not-a-status")]
    public async Task AdminOrderStatus_RejectsNumericAndUnknownEnumValues(string status)
    {
        int orderId;
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = await userManager.FindByEmailAsync("client@frameforge.dev");
            var product = await db.Products.AsNoTracking().FirstAsync();
            var order = new Order
            {
                UserId = user!.Id,
                Status = OrderStatus.Pending,
                TotalPrice = product.Price,
                Items =
                {
                    new OrderItem
                    {
                        ProductId = product.Id,
                        UnitPrice = product.Price,
                        Quantity = 1,
                    },
                },
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync();
            orderId = order.Id;
        }

        var admin = await TestAuth.AdminClientAsync(_factory);
        var response = await admin.PutAsJsonAsync(
            $"/api/admin/orders/{orderId}/status",
            new { status });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
