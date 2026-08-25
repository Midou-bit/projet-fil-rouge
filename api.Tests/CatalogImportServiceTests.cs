using api.Services;

namespace api.Tests;

/// <summary>Fonctions pures d'estimation utilisées par l'import FreeToGame et le seed curaté.</summary>
public class CatalogImportServiceTests
{
    [Theory]
    [InlineData(2012, null, 32, 38)] // span=0 → base pure
    [InlineData(2025, null, 78, 69)] // span=13, cast int = troncature (pas d'arrondi)
    public void EstimateDifficulty_ScalesWithReleaseYear(int year, string? genre, int expectedGpu, int expectedCpu)
    {
        var (gpu, cpu, _) = CatalogImportService.EstimateDifficulty(year, genre);
        Assert.Equal(expectedGpu, gpu);
        Assert.Equal(expectedCpu, cpu);
    }

    [Fact]
    public void EstimateDifficulty_ShooterIsHarderThanPuzzle_SameYear()
    {
        var (shooterGpu, _, _) = CatalogImportService.EstimateDifficulty(2020, "Shooter");
        var (puzzleGpu, _, _) = CatalogImportService.EstimateDifficulty(2020, "Puzzle");
        Assert.True(shooterGpu > puzzleGpu);
    }

    [Fact]
    public void EstimateDifficulty_RamTier_FollowsReleaseEra()
    {
        Assert.Equal(8, CatalogImportService.EstimateDifficulty(2015, null).ram);
        Assert.Equal(12, CatalogImportService.EstimateDifficulty(2018, null).ram);
        Assert.Equal(16, CatalogImportService.EstimateDifficulty(2022, null).ram);
    }

    [Fact]
    public void GenerateRequirements_ProducesSixCombinations()
    {
        var reqs = CatalogImportService.GenerateRequirements(baseGpu: 60, baseCpu: 60, ram: 16);
        Assert.Equal(6, reqs.Count); // 3 résolutions x 2 paliers fps
        Assert.Contains(reqs, r => r.Resolution == "4K" && r.TargetFps == 144);
    }

    [Fact]
    public void GenerateRequirements_HigherResolutionAndFps_RaisesGpuThreshold()
    {
        var reqs = CatalogImportService.GenerateRequirements(baseGpu: 60, baseCpu: 60, ram: 16);
        var at1080p60 = reqs.Single(r => r.Resolution == "1080p" && r.TargetFps == 60);
        var at4k144 = reqs.Single(r => r.Resolution == "4K" && r.TargetFps == 144);
        Assert.True(at4k144.RecoGpuScore > at1080p60.RecoGpuScore);
    }

    [Fact]
    public void GenerateRequirements_MinScoreIsSixtyPercentOfReco()
    {
        var reqs = CatalogImportService.GenerateRequirements(baseGpu: 60, baseCpu: 60, ram: 16);
        foreach (var r in reqs)
        {
            Assert.Equal((int)Math.Round(r.RecoGpuScore * 0.6), r.MinGpuScore);
            Assert.Equal((int)Math.Round(r.RecoCpuScore * 0.6), r.MinCpuScore);
        }
    }
}
