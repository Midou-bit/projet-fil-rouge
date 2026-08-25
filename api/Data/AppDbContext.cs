using api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Game> Games => Set<Game>();
    public DbSet<GameRequirement> GameRequirements => Set<GameRequirement>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<SupportMessage> SupportMessages => Set<SupportMessage>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // SQLite ne gère pas decimal nativement. On stocke les montants en CENTIMES ENTIERS
        // (INTEGER) plutôt qu'en double : précision exacte (pas de dérive flottante sur les sommes)
        // ET tri numérique correct en SQL (contrairement à un stockage texte, où "199.99" < "9.99").
        var money = new ValueConverter<decimal, long>(
            v => (long)Math.Round(v * 100m, MidpointRounding.AwayFromZero),
            v => v / 100m);
        b.Entity<Product>().Property(p => p.Price).HasConversion(money);
        b.Entity<Order>().Property(o => o.TotalPrice).HasConversion(money);
        b.Entity<OrderItem>().Property(o => o.UnitPrice).HasConversion(money);

        // Token de concurrence sur le stock : deux écritures concurrentes sur le même produit
        // (ajout panier, confirmation de commande) ne peuvent pas s'écraser silencieusement — la
        // 2e lève DbUpdateConcurrencyException, gérée par les contrôleurs comme un conflit de stock.
        b.Entity<Product>().Property(p => p.Stock).IsConcurrencyToken();

        b.Entity<Category>().HasIndex(c => c.Slug).IsUnique();

        b.Entity<Product>()
            .HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Un panier par utilisateur
        b.Entity<Cart>()
            .HasOne(c => c.User)
            .WithOne(u => u.Cart)
            .HasForeignKey<Cart>(c => c.UserId);

        b.Entity<CartItem>()
            .HasOne(ci => ci.Product)
            .WithMany()
            .HasForeignKey(ci => ci.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<OrderItem>()
            .HasOne(oi => oi.Product)
            .WithMany()
            .HasForeignKey(oi => oi.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        b.Entity<GameRequirement>()
            .HasOne(r => r.Game)
            .WithMany(g => g.Requirements)
            .HasForeignKey(r => r.GameId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<Review>()
            .HasOne(r => r.Product)
            .WithMany(p => p.Reviews)
            .HasForeignKey(r => r.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
