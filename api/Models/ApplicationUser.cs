using Microsoft.AspNetCore.Identity;

namespace api.Models;

/// <summary>Étend IdentityUser : Id/Email/PasswordHash viennent d'Identity, on ajoute CreatedAt.
/// Le rôle (Admin/Client) est géré via les rôles Identity.</summary>
public class ApplicationUser : IdentityUser
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Cart? Cart { get; set; }
    public List<Order> Orders { get; set; } = new();
    public List<Review> Reviews { get; set; } = new();
}

public static class Roles
{
    public const string Admin = "Admin";
    public const string Client = "Client";
}
