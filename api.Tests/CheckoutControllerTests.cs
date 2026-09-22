using System.Security.Claims;
using api.Controllers;
using api.Data;
using api.DTOs;
using api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace api.Tests;

public class CheckoutControllerTests : IDisposable
{
    private readonly AppDbContext _db;

    public CheckoutControllerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite($"Data Source=file:{Guid.NewGuid():N}?mode=memory&cache=shared")
            .Options;
        _db = new AppDbContext(options);
        _db.Database.OpenConnection();
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Database.CloseConnection();

    [Theory]
    [InlineData(null)]
    [InlineData("StripeTest")]
    public async Task Create_RequiresExplicitUsablePaymentMode(string? mode)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Stripe:Mode"] = mode,
            ["Stripe:SecretKey"] = ""
        }).Build();
        var controller = new CheckoutController(_db, config, NullLogger<CheckoutController>.Instance);

        var result = await controller.Create();

        var response = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, response.StatusCode);
        Assert.Empty(_db.Orders);
    }

    [Fact]
    public async Task Confirm_StripeOrderWithoutTestKey_IsUnavailableAndNeverSimulated()
    {
        const string userId = "stripe-owner";
        _db.Users.Add(new ApplicationUser { Id = userId, UserName = "owner@test.dev", Email = "owner@test.dev" });
        var order = new Order
        {
            UserId = userId,
            Status = OrderStatus.Pending,
            TotalPrice = 42m,
            StripeSessionId = "cs_test_existing_session"
        };
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Stripe:Mode"] = "Simulation",
            ["Stripe:SecretKey"] = ""
        }).Build();
        var controller = new CheckoutController(_db, config, NullLogger<CheckoutController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, userId)
                    }, "test"))
                }
            }
        };

        var result = await controller.Confirm(order.Id);

        var response = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, response.StatusCode);
        Assert.Equal(OrderStatus.Pending, (await _db.Orders.FindAsync(order.Id))!.Status);
    }

    [Fact]
    public async Task Create_WithPendingStripeOrder_ReturnsConflictAndPreservesExistingOrder()
    {
        const string userId = "stripe-pending-owner";
        var user = new ApplicationUser
        {
            Id = userId,
            UserName = "pending@test.dev",
            Email = "pending@test.dev"
        };
        var product = new Product
        {
            Name = "Test GPU",
            Description = "Produit de test",
            Category = new Category { Name = "GPU", Slug = "gpu" },
            Price = 299m,
            Stock = 2
        };
        _db.Users.Add(user);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        _db.Carts.Add(new Cart
        {
            UserId = userId,
            Items = { new CartItem { ProductId = product.Id, Quantity = 1 } }
        });
        var existingOrder = new Order
        {
            UserId = userId,
            Status = OrderStatus.Pending,
            TotalPrice = product.Price,
            StripeSessionId = "cs_test_active_session",
            Items =
            {
                new OrderItem
                {
                    ProductId = product.Id,
                    Quantity = 1,
                    UnitPrice = product.Price
                }
            }
        };
        _db.Orders.Add(existingOrder);
        await _db.SaveChangesAsync();

        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Stripe:Mode"] = "Simulation"
        }).Build();
        var controller = NewController(config, userId);

        var result = await controller.Create();

        var response = Assert.IsType<ConflictObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status409Conflict, response.StatusCode);
        var orders = await _db.Orders.Where(o => o.UserId == userId).ToListAsync();
        var preserved = Assert.Single(orders);
        Assert.Equal(existingOrder.Id, preserved.Id);
        Assert.Equal(OrderStatus.Pending, preserved.Status);
        Assert.Equal("cs_test_active_session", preserved.StripeSessionId);
    }

    private CheckoutController NewController(IConfiguration config, string userId) =>
        new(_db, config, NullLogger<CheckoutController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, userId)
                    }, "test"))
                }
            }
        };
}
