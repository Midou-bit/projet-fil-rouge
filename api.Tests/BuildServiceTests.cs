using api.Data;
using api.Models;
using api.Services;
using Microsoft.EntityFrameworkCore;

namespace api.Tests;

public class BuildServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly BuildService _svc;
    private readonly Category _gpu = new() { Name = "Carte graphique", Slug = "gpu" };
    private readonly Category _cpu = new() { Name = "Processeur", Slug = "cpu" };
    private readonly Category _ram = new() { Name = "Mémoire", Slug = "ram" };
    private readonly Category _mobo = new() { Name = "Carte mère", Slug = "carte-mere" };
    private readonly Category _psu = new() { Name = "Alimentation", Slug = "alimentation" };

    public BuildServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite($"Data Source=file:{Guid.NewGuid():N}?mode=memory&cache=shared")
            .Options;
        _db = new AppDbContext(options);
        _db.Database.OpenConnection();
        _db.Database.EnsureCreated();
        _svc = new BuildService(_db);

        _db.Categories.AddRange(_gpu, _cpu, _ram, _mobo, _psu);
        _db.Products.AddRange(
            new Product { Category = _gpu, Name = "GPU faible", Brand = "X", Price = 100, Stock = 5, PerfScore = 20, Specs = "{\"Tdp\":\"120W\"}" },
            new Product { Category = _gpu, Name = "GPU hors stock", Brand = "X", Price = 200, Stock = 0, PerfScore = 80 },
            new Product { Category = _gpu, Name = "GPU cher mais fort", Brand = "X", Price = 900, Stock = 5, PerfScore = 90, Specs = "{\"Tdp\":\"400W\"}" },
            new Product { Category = _gpu, Name = "GPU milieu", Brand = "X", Price = 400, Stock = 5, PerfScore = 65, Specs = "{\"Tdp\":\"250W\"}" },
            new Product { Category = _cpu, Name = "CPU faible", Brand = "X", Price = 80, Stock = 5, PerfScore = 25, Specs = "{\"Socket\":\"AM5\"}" },
            new Product { Category = _cpu, Name = "CPU fort", Brand = "X", Price = 350, Stock = 5, PerfScore = 70, Specs = "{\"Socket\":\"AM5\"}" },
            new Product { Category = _ram, Name = "RAM 16", Brand = "X", Price = 50, Stock = 5, PerfScore = 50, Specs = "{\"Capacity\":\"16 GB\",\"Type\":\"DDR5\"}" },
            new Product { Category = _ram, Name = "RAM 32", Brand = "X", Price = 90, Stock = 5, PerfScore = 75, Specs = "{\"Capacity\":\"32 GB\",\"Type\":\"DDR5\"}" },
            new Product { Category = _mobo, Name = "Carte mère incompatible", Brand = "X", Price = 80, Stock = 5, PerfScore = 80, Specs = "{\"Socket\":\"LGA1700\",\"Ram\":\"DDR4\"}" },
            new Product { Category = _mobo, Name = "Carte mère AM5", Brand = "X", Price = 150, Stock = 5, PerfScore = 70, Specs = "{\"Socket\":\"AM5\",\"Ram\":\"DDR5\"}" },
            new Product { Category = _psu, Name = "Alim 500", Brand = "X", Price = 60, Stock = 5, PerfScore = 40, Specs = "{\"Wattage\":\"500W\"}" },
            new Product { Category = _psu, Name = "Alim 850", Brand = "X", Price = 120, Stock = 5, PerfScore = 80, Specs = "{\"Wattage\":\"850W\"}" }
        );
        _db.SaveChanges();
    }

    public void Dispose() => _db.Database.CloseConnection();

    private GameRequirement Req(int recoGpu, int recoCpu, int minRam = 16) => new()
    {
        Resolution = "1080p", TargetFps = 60, RecoGpuScore = recoGpu, RecoCpuScore = recoCpu, MinRamGb = minRam,
    };

    [Fact]
    public async Task RecommendBuild_PicksCheapestPartMeetingThreshold()
    {
        var parts = await _svc.RecommendBuild(Req(recoGpu: 60, recoCpu: 60));
        var gpu = parts.Single(p => p.CategoryId == _gpu.Id);
        // Le GPU "milieu" (65) est le moins cher qui atteint le seuil 60 → pas le plus cher.
        Assert.Equal("GPU milieu", gpu.Name);
    }

    [Fact]
    public async Task RecommendBuild_FallsBackToStrongestWhenNoneMeetsThreshold()
    {
        var parts = await _svc.RecommendBuild(Req(recoGpu: 999, recoCpu: 999));
        var gpu = parts.Single(p => p.CategoryId == _gpu.Id);
        Assert.Equal("GPU cher mais fort", gpu.Name); // le plus puissant dispo, à défaut de mieux
    }

    [Fact]
    public async Task RecommendBuild_PicksLargerRamTierWhenGameNeedsMore()
    {
        var lowRamNeed = await _svc.RecommendBuild(Req(recoGpu: 20, recoCpu: 20, minRam: 8));
        var highRamNeed = await _svc.RecommendBuild(Req(recoGpu: 20, recoCpu: 20, minRam: 32));

        Assert.Equal("RAM 16", lowRamNeed.Single(p => p.CategoryId == _ram.Id).Name);
        Assert.Equal("RAM 32", highRamNeed.Single(p => p.CategoryId == _ram.Id).Name);
    }

    [Fact]
    public async Task UpgradeFor_ReturnsCheapestMeetingScore()
    {
        var upgrade = await _svc.UpgradeFor("gpu", 60);
        Assert.Equal("GPU milieu", upgrade!.Name);

        var impossibleUpgrade = await _svc.UpgradeFor("gpu", 95);
        Assert.Null(impossibleUpgrade);
    }

    [Fact]
    public async Task RecommendBuild_DoesNotPickOutOfStockPartWhenAvailableAlternativeMeetsThreshold()
    {
        var parts = await _svc.RecommendBuild(Req(recoGpu: 60, recoCpu: 60));
        var gpu = parts.Single(p => p.CategoryId == _gpu.Id);

        Assert.Equal("GPU milieu", gpu.Name);
        Assert.True(gpu.Stock > 0);
    }

    [Fact]
    public async Task RecommendBuild_RespectsCpuSocketRamTypeAndRequiredPower()
    {
        var parts = await _svc.RecommendBuild(Req(recoGpu: 60, recoCpu: 60, minRam: 16));
        var gpu = parts.Single(p => p.CategoryId == _gpu.Id);
        var cpu = parts.Single(p => p.CategoryId == _cpu.Id);
        var ram = parts.Single(p => p.CategoryId == _ram.Id);
        var mobo = parts.Single(p => p.CategoryId == _mobo.Id);
        var psu = parts.Single(p => p.CategoryId == _psu.Id);

        Assert.Equal(ProductSpecs.Read(cpu, "Socket"), ProductSpecs.Read(mobo, "Socket"));
        Assert.Equal(ProductSpecs.Read(mobo, "Ram"), ProductSpecs.Read(ram, "Type"));
        var requiredWatts = (int)Math.Ceiling((ProductSpecs.ReadNumber(gpu, "Tdp") + 150) * 1.3);
        Assert.True(ProductSpecs.ReadNumber(psu, "Wattage") >= requiredWatts);
    }
}
