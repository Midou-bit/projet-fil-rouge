using api.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;

namespace api.Tests;

public class JwtKeyProviderTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("too-short")]
    [InlineData("remplace-par-une-cle-d-au-moins-32-caracteres-aleatoires")]
    public void Resolve_RejectsMissingWeakOrPlaceholderProductionKey(string? key)
    {
        var config = Configuration(key);
        var error = Assert.Throws<InvalidOperationException>(() =>
            JwtKeyProvider.Resolve(config, new ProductionEnvironment()));

        if (!string.IsNullOrEmpty(key))
            Assert.DoesNotContain(key, error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Resolve_AcceptsStrongProductionKey()
    {
        var config = Configuration("Yz9!Qm4#Wp7@Lr2$Tx8&Nk5*Hs3_Bv6+Df1");

        var key = JwtKeyProvider.Resolve(config, new ProductionEnvironment());

        Assert.IsType<SymmetricSecurityKey>(key);
        Assert.True(key.KeySize >= 256);
    }

    [Theory]
    [InlineData(null, "FrameForgeClient", "12")]
    [InlineData("FrameForge", null, "12")]
    [InlineData("FrameForge", "FrameForgeClient", "0")]
    [InlineData("FrameForge", "FrameForgeClient", "25")]
    public void ValidateConfiguration_RejectsIncompleteOrUnsafeLifetime(
        string? issuer,
        string? audience,
        string? expiry)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Issuer"] = issuer,
                ["Jwt:Audience"] = audience,
                ["Jwt:ExpireHours"] = expiry,
            })
            .Build();

        Assert.Throws<InvalidOperationException>(() => JwtKeyProvider.ValidateConfiguration(config));
    }

    private static IConfiguration Configuration(string? key) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = key,
                ["Jwt:Issuer"] = "FrameForge",
                ["Jwt:Audience"] = "FrameForgeClient",
                ["Jwt:ExpireHours"] = "12",
            })
            .Build();

    private sealed class ProductionEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Production;
        public string ApplicationName { get; set; } = "api.Tests";
        public string ContentRootPath { get; set; } = Directory.GetCurrentDirectory();
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
