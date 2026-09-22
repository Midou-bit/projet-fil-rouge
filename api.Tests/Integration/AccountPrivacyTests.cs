using System.Net;
using System.Net.Http.Json;
using api.Data;
using api.DTOs;
using api.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace api.Tests.Integration;

public class AccountPrivacyTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public AccountPrivacyTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Export_IsAuthenticated_OwnerScoped_AndContainsNoInternalFields()
    {
        var ownerEmail = $"export-owner-{Guid.NewGuid():N}@test.dev";
        var owner = await RegisterAsync(ownerEmail);
        var strangerEmail = $"export-stranger-{Guid.NewGuid():N}@test.dev";
        var stranger = await RegisterAsync(strangerEmail);

        var product = (await owner.GetFromJsonAsync<PagedResult<ProductDto>>(
            "/api/products?pageSize=1"))!.Items.Single();
        var add = await owner.PostAsJsonAsync(
            "/api/cart/items",
            new { productId = product.Id, quantity = 1 });
        add.EnsureSuccessStatusCode();

        var ownerSupport = await owner.PostAsJsonAsync(
            "/api/support",
            new
            {
                email = ownerEmail,
                subject = "Demande export",
                message = "Contenu strictement rattaché au propriétaire du compte.",
            });
        ownerSupport.EnsureSuccessStatusCode();

        var strangerMarker = $"private-{Guid.NewGuid():N}";
        var strangerSupport = await stranger.PostAsJsonAsync(
            "/api/support",
            new
            {
                email = strangerEmail,
                subject = "Message tiers",
                message = strangerMarker,
            });
        strangerSupport.EnsureSuccessStatusCode();

        var guestMarker = $"guest-{Guid.NewGuid():N}";
        var guestSupport = await _factory.CreateClient().PostAsJsonAsync(
            "/api/support",
            new
            {
                email = ownerEmail,
                subject = "Message invité",
                message = guestMarker,
            });
        guestSupport.EnsureSuccessStatusCode();

        var ownerReviewMarker = $"owner-review-{Guid.NewGuid():N}";
        var strangerReviewMarker = $"stranger-review-{Guid.NewGuid():N}";
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var ownerId = (await users.FindByEmailAsync(ownerEmail))!.Id;
            var strangerId = (await users.FindByEmailAsync(strangerEmail))!.Id;
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            db.Orders.AddRange(
                new Order
                {
                    UserId = ownerId,
                    Status = OrderStatus.Paid,
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
                },
                new Order
                {
                    UserId = strangerId,
                    Status = OrderStatus.Paid,
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
                });
            db.Reviews.AddRange(
                new Review
                {
                    UserId = ownerId,
                    ProductId = product.Id,
                    Rating = 5,
                    Comment = ownerReviewMarker,
                },
                new Review
                {
                    UserId = strangerId,
                    ProductId = product.Id,
                    Rating = 1,
                    Comment = strangerReviewMarker,
                });
            await db.SaveChangesAsync();
        }

        var response = await owner.GetAsync("/api/account/export");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var export = await response.Content.ReadFromJsonAsync<AccountExportDto>();

        Assert.NotNull(export);
        Assert.Equal(ownerEmail, export.Account.Email);
        Assert.Contains("Client", export.Account.Roles);
        Assert.Contains(export.Cart.Items, item => item.ProductId == product.Id && item.Quantity == 1);
        Assert.Single(export.Orders);
        Assert.Equal("Paid", export.Orders[0].Status);
        Assert.Single(export.Reviews);
        Assert.Equal(ownerReviewMarker, export.Reviews[0].Comment);
        Assert.Single(export.SupportMessages);
        Assert.Equal("Demande export", export.SupportMessages[0].Subject);

        var json = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain(strangerEmail, json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(strangerMarker, json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(strangerReviewMarker, json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(guestMarker, json, StringComparison.OrdinalIgnoreCase);
        foreach (var forbidden in new[]
                 {
                     "userId", "passwordHash", "securityStamp", "concurrencyStamp",
                     "stripeSessionId", "token", "customerEmail",
                 })
            Assert.DoesNotContain(forbidden, json, StringComparison.OrdinalIgnoreCase);

        var anonymous = _factory.CreateClient();
        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await anonymous.GetAsync("/api/account/export")).StatusCode);
    }

    [Fact]
    public async Task Delete_RemovesIdentityAndAllOwnedPersonalData()
    {
        var email = $"erase-{Guid.NewGuid():N}@test.dev";
        var client = await RegisterAsync(email);
        var preservedEmail = $"erase-neighbour-{Guid.NewGuid():N}@test.dev";
        _ = await RegisterAsync(preservedEmail);
        string userId;
        string preservedUserId;

        await using (var beforeScope = _factory.Services.CreateAsyncScope())
        {
            var users = beforeScope.ServiceProvider
                .GetRequiredService<UserManager<api.Models.ApplicationUser>>();
            userId = (await users.FindByEmailAsync(email))!.Id;
            preservedUserId = (await users.FindByEmailAsync(preservedEmail))!.Id;
        }

        var product = (await client.GetFromJsonAsync<PagedResult<ProductDto>>(
            "/api/products?pageSize=1"))!.Items.Single();
        (await client.PostAsJsonAsync(
            "/api/cart/items",
            new { productId = product.Id, quantity = 1 })).EnsureSuccessStatusCode();
        (await client.PostAsJsonAsync(
            "/api/support",
            new
            {
                email,
                subject = "Effacement du compte",
                message = "Ce message doit disparaître avec toutes mes données personnelles.",
            })).EnsureSuccessStatusCode();

        await using (var dataScope = _factory.Services.CreateAsyncScope())
        {
            var db = dataScope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Orders.AddRange(
                new Order
                {
                    UserId = userId,
                    Status = OrderStatus.Paid,
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
                },
                new Order
                {
                    UserId = preservedUserId,
                    Status = OrderStatus.Paid,
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
                });
            db.Reviews.AddRange(
                new Review
                {
                    UserId = userId,
                    ProductId = product.Id,
                    Rating = 4,
                    Comment = "À effacer",
                },
                new Review
                {
                    UserId = preservedUserId,
                    ProductId = product.Id,
                    Rating = 4,
                    Comment = "À conserver",
                });
            await db.SaveChangesAsync();
        }

        var delete = await client.DeleteAsync("/api/account");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);

        await using (var afterScope = _factory.Services.CreateAsyncScope())
        {
            var db = afterScope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.False(await db.Users.AsNoTracking().AnyAsync(user => user.Id == userId));
            Assert.True(await db.Users.AsNoTracking().AnyAsync(user => user.Id == preservedUserId));
            Assert.False(await db.Carts.AsNoTracking().AnyAsync(cart => cart.UserId == userId));
            Assert.False(await db.Orders.AsNoTracking().AnyAsync(order => order.UserId == userId));
            Assert.False(await db.Reviews.AsNoTracking().AnyAsync(review => review.UserId == userId));
            Assert.False(await db.SupportMessages.AsNoTracking().AnyAsync(message => message.UserId == userId));
            Assert.True(await db.Orders.AsNoTracking().AnyAsync(order => order.UserId == preservedUserId));
            Assert.True(await db.Reviews.AsNoTracking().AnyAsync(review => review.UserId == preservedUserId));
        }

        var login = await _factory.CreateClient().PostAsJsonAsync(
            "/api/auth/login",
            new { email, password = "Passw0rd!Test" });
        Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await client.GetAsync("/api/account/export")).StatusCode);
    }

    [Theory]
    [InlineData("admin@frameforge.dev", "AdminFrame2026!")]
    [InlineData("client@frameforge.dev", "ClientFrame2026!")]
    public async Task Delete_ProtectsSeededDemoAccounts(string email, string password)
    {
        var client = _factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        login.EnsureSuccessStatusCode();
        var auth = await login.Content.ReadFromJsonAsync<AuthResponseDto>();
        client.Authorize(auth!.Token);

        Assert.Equal(HttpStatusCode.BadRequest, (await client.DeleteAsync("/api/account")).StatusCode);
    }

    private async Task<HttpClient> RegisterAsync(string email)
    {
        var client = _factory.CreateClient();
        var register = await client.PostAsJsonAsync(
            "/api/auth/register",
            new { email, password = "Passw0rd!Test" });
        register.EnsureSuccessStatusCode();
        var auth = await register.Content.ReadFromJsonAsync<AuthResponseDto>();
        client.Authorize(auth!.Token);
        return client;
    }
}

public sealed class DeleteFailingApiFactory : ApiFactory
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<UserManager<ApplicationUser>>();
            services.AddScoped<UserManager<ApplicationUser>, DeleteFailingUserManager>();
        });
    }
}

public sealed class DeleteFailingUserManager : UserManager<ApplicationUser>
{
    public DeleteFailingUserManager(
        IUserStore<ApplicationUser> store,
        IOptions<IdentityOptions> optionsAccessor,
        IPasswordHasher<ApplicationUser> passwordHasher,
        IEnumerable<IUserValidator<ApplicationUser>> userValidators,
        IEnumerable<IPasswordValidator<ApplicationUser>> passwordValidators,
        ILookupNormalizer keyNormalizer,
        IdentityErrorDescriber errors,
        IServiceProvider services,
        ILogger<UserManager<ApplicationUser>> logger)
        : base(
            store,
            optionsAccessor,
            passwordHasher,
            userValidators,
            passwordValidators,
            keyNormalizer,
            errors,
            services,
            logger)
    {
    }

    public override Task<IdentityResult> DeleteAsync(ApplicationUser user) =>
        Task.FromResult(IdentityResult.Failed(new IdentityError
        {
            Code = "InjectedDeleteFailure",
            Description = "Échec injecté par le test.",
        }));
}

public class AccountDeletionRollbackTests : IClassFixture<DeleteFailingApiFactory>
{
    private readonly DeleteFailingApiFactory _factory;

    public AccountDeletionRollbackTests(DeleteFailingApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Delete_WhenIdentityFails_RollsBackOwnedData()
    {
        var email = $"rollback-{Guid.NewGuid():N}@test.dev";
        var client = _factory.CreateClient();
        var register = await client.PostAsJsonAsync(
            "/api/auth/register",
            new { email, password = "Passw0rd!Test" });
        register.EnsureSuccessStatusCode();
        var auth = await register.Content.ReadFromJsonAsync<AuthResponseDto>();
        client.Authorize(auth!.Token);

        var product = (await client.GetFromJsonAsync<PagedResult<ProductDto>>(
            "/api/products?pageSize=1"))!.Items.Single();
        (await client.PostAsJsonAsync(
            "/api/cart/items",
            new { productId = product.Id, quantity = 1 })).EnsureSuccessStatusCode();
        (await client.PostAsJsonAsync(
            "/api/support",
            new
            {
                email,
                subject = "Test transaction",
                message = "Cette donnée doit être restaurée après l'échec Identity.",
            })).EnsureSuccessStatusCode();

        string userId;
        await using (var beforeScope = _factory.Services.CreateAsyncScope())
        {
            var users = beforeScope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            userId = (await users.FindByEmailAsync(email))!.Id;
        }

        var delete = await client.DeleteAsync("/api/account");
        Assert.Equal(HttpStatusCode.InternalServerError, delete.StatusCode);

        await using var afterScope = _factory.Services.CreateAsyncScope();
        var db = afterScope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.True(await db.Users.AsNoTracking().AnyAsync(user => user.Id == userId));
        Assert.True(await db.Carts.AsNoTracking().AnyAsync(cart => cart.UserId == userId));
        Assert.True(await db.SupportMessages.AsNoTracking().AnyAsync(message => message.UserId == userId));
    }
}
