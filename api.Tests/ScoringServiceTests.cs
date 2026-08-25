using api.Models;
using api.Services;
using Xunit;

namespace api.Tests;

/// <summary>
/// Tests du moteur de score. Fonctions pures → cibles idéales pour des tests unitaires.
/// </summary>
public class ScoringServiceTests
{
    private readonly ScoringService _svc = new();

    private static GameRequirement Req(
        string res = "1080p", int fps = 60,
        int recoGpu = 60, int recoCpu = 60, int minRam = 16) => new()
    {
        Resolution = res,
        TargetFps = fps,
        RecoGpuScore = recoGpu,
        MinGpuScore = (int)(recoGpu * 0.6),
        RecoCpuScore = recoCpu,
        MinCpuScore = (int)(recoCpu * 0.6),
        MinRamGb = minRam,
    };

    [Theory]
    [InlineData("1080p", 1.0)]
    [InlineData("1440p", 0.7)]
    [InlineData("4K", 0.45)]
    [InlineData("inconnu", 1.0)] // défaut robuste
    public void ResolutionFactor_MapsResolution(string res, double expected)
        => Assert.Equal(expected, ScoringService.ResolutionFactor(res));

    [Fact]
    public void EstimateFps_AtRecommendedScore_1080p60_HitsTarget()
    {
        // GPU = CPU = reco, 1080p/60 → exactement la cible (facteur 1.0).
        var fps = _svc.EstimateFps(60, 60, Req(recoGpu: 60, recoCpu: 60, fps: 60));
        Assert.Equal(60, fps);
    }

    [Fact]
    public void EstimateFps_1440p_AppliesResolutionFactor()
    {
        // 1440p applique 0.7 côté GPU → borne GPU = 60*0.7 = 42, borne CPU = 60 → min = 42.
        var fps = _svc.EstimateFps(60, 60, Req(res: "1440p", recoGpu: 60, recoCpu: 60, fps: 60));
        Assert.Equal(42, fps);
    }

    [Fact]
    public void EstimateFps_WeakestComponentLimits()
    {
        // CPU très faible doit brider même avec un GPU énorme.
        var fps = _svc.EstimateFps(gpuScore: 100, cpuScore: 30, Req(recoGpu: 60, recoCpu: 60, fps: 60));
        var cpuBound = (int)System.Math.Round(30.0 / 60 * 60); // = 30
        Assert.Equal(cpuBound, fps);
    }

    [Fact]
    public void BottleneckPenalty_NoneWhenBalanced()
        => Assert.Equal(0, _svc.BottleneckPenalty(80, 75)); // écart 5 ≤ 25

    [Fact]
    public void BottleneckPenalty_AppliesBeyondThreshold()
    {
        // écart 50 → (50-25)*0.6 = 15
        Assert.Equal(15, _svc.BottleneckPenalty(90, 40));
        Assert.True(_svc.BottleneckPenalty(90, 40) > 0);
    }

    [Fact]
    public void GamingPerformance_WeightsGpu70Cpu30_AndClamps()
    {
        // GPU=CPU=80, pas de bottleneck → 80. Pondération vérifiée via valeurs distinctes :
        Assert.Equal(80, _svc.GamingPerformance(80, 80));
        // 90/50 : pondéré = 90*.7+50*.3 = 78 ; bottleneck (écart 40) = 9 → 69
        Assert.Equal(69, _svc.GamingPerformance(90, 50));
        Assert.InRange(_svc.GamingPerformance(100, 100), 0, 100);
    }

    [Theory]
    [InlineData(70, 60, "Ultra")]   // marge ≥ 1.15
    [InlineData(55, 60, "Élevé")]   // marge ≥ 0.85
    [InlineData(40, 60, "Moyen")]   // en dessous
    public void VisualQuality_FromMarginVsReco(int gpu, int recoGpu, string expected)
        => Assert.Equal(expected, _svc.VisualQuality(gpu, Req(recoGpu: recoGpu)));

    [Fact]
    public void Evaluate_TooWeak_WhenBelowMinimum()
    {
        var r = _svc.Evaluate(gpuScore: 20, cpuScore: 20, ramGb: 8, Req(recoGpu: 80, recoCpu: 80, minRam: 16));
        Assert.False(r.MeetsMinimum);
        Assert.False(r.MeetsRecommended);
        Assert.Equal("Trop faible", r.Verdict);
    }

    [Fact]
    public void Evaluate_Recommended_WhenAboveReco()
    {
        var r = _svc.Evaluate(gpuScore: 90, cpuScore: 90, ramGb: 32, Req(recoGpu: 70, recoCpu: 70, minRam: 16));
        Assert.True(r.MeetsMinimum);
        Assert.True(r.MeetsRecommended);
        Assert.Equal("Ça tourne (recommandé)", r.Verdict);
    }

    [Fact]
    public void Evaluate_MinimumButNotRecommended_BetweenThresholds()
    {
        // Au-dessus du min (0.6*reco=42) mais sous le reco (70).
        var r = _svc.Evaluate(gpuScore: 60, cpuScore: 60, ramGb: 16, Req(recoGpu: 70, recoCpu: 70, minRam: 16));
        Assert.True(r.MeetsMinimum);
        Assert.False(r.MeetsRecommended);
        Assert.Equal("Ça tourne (minimum)", r.Verdict);
    }

    [Fact]
    public void Evaluate_RamBelowMinimum_FailsMinimum()
    {
        // GPU/CPU suffisants mais RAM insuffisante → pas le minimum.
        var r = _svc.Evaluate(gpuScore: 90, cpuScore: 90, ramGb: 8, Req(recoGpu: 70, recoCpu: 70, minRam: 16));
        Assert.False(r.MeetsMinimum);
    }

    [Fact]
    public void PriceValue_HigherWhenCheaper()
    {
        var expensive = _svc.PriceValue(80, 2000m);
        var cheap = _svc.PriceValue(80, 1000m);
        Assert.True(cheap > expensive);
        Assert.Equal(0, _svc.PriceValue(80, 0m)); // garde-fou division par zéro
    }
}
