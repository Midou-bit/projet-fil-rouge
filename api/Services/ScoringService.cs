using api.Models;

namespace api.Services;

/// <summary>
/// Le cerveau du site. Modèle d'ESTIMATION assumé — pas des benchmarks réels.
/// Utilisé par les modes "je veux jouer à X", le vérificateur et le builder.
/// </summary>
public class ScoringService
{
    public const int BottleneckGap = 25; // écart GPU/CPU au-delà duquel on pénalise

    /// <summary>
    /// FPS estimés : le composant le plus faible limite (min des deux bornes).
    /// Les scores recommandés du requirement sont déjà propres à sa résolution et à sa cible FPS :
    /// on ne réapplique donc aucun facteur de résolution ici.
    /// </summary>
    public int EstimateFps(int gpuScore, int cpuScore, GameRequirement req)
    {
        var recoGpu = Math.Max(1, req.RecoGpuScore);
        var recoCpu = Math.Max(1, req.RecoCpuScore);
        var fpsGpuBound = (double)gpuScore / recoGpu * req.TargetFps;
        var fpsCpuBound = (double)cpuScore / recoCpu * req.TargetFps;
        return (int)Math.Round(Math.Min(fpsGpuBound, fpsCpuBound), MidpointRounding.AwayFromZero);
    }

    /// <summary>Malus 0-100 quand GPU et CPU sont trop éloignés (CPU faible bride le GPU).</summary>
    public int BottleneckPenalty(int gpuScore, int cpuScore)
    {
        var gap = Math.Abs(gpuScore - cpuScore);
        if (gap <= BottleneckGap) return 0;
        // pénalité progressive : chaque point au-delà du seuil coûte ~0.6
        return (int)Math.Round((gap - BottleneckGap) * 0.6, MidpointRounding.AwayFromZero);
    }

    /// <summary>Performance gaming globale : 70% GPU + 30% CPU, moins le bottleneck.</summary>
    public int GamingPerformance(int gpuScore, int cpuScore)
    {
        var weighted = gpuScore * 0.7 + cpuScore * 0.3;
        var score = weighted - BottleneckPenalty(gpuScore, cpuScore);
        return Math.Clamp((int)Math.Round(score, MidpointRounding.AwayFromZero), 0, 100);
    }

    /// <summary>Qualité visuelle atteignable selon la marge vs RecoGpuScore.</summary>
    public string VisualQuality(int gpuScore, GameRequirement req)
    {
        var margin = (double)gpuScore / req.RecoGpuScore;
        if (margin >= 1.15) return "Ultra";
        if (margin >= 0.85) return "Élevé";
        return "Moyen";
    }

    /// <summary>Rapport perf/prix (perf gaming par tranche de 100€), arrondi 1 décimale.</summary>
    public double PriceValue(int gamingPerformance, decimal totalPrice)
    {
        if (totalPrice <= 0) return 0;
        return Math.Round(gamingPerformance / (double)totalPrice * 100, 1);
    }

    /// <summary>Verdict du vérificateur pour un couple (CPU, GPU, jeu, résolution).</summary>
    public ScoreResult Evaluate(int gpuScore, int cpuScore, int ramGb, GameRequirement req, decimal totalPrice = 0)
    {
        var fps = EstimateFps(gpuScore, cpuScore, req);
        var gaming = GamingPerformance(gpuScore, cpuScore);
        var meetsMin = gpuScore >= req.MinGpuScore && cpuScore >= req.MinCpuScore && ramGb >= req.MinRamGb;
        // Le modèle ne distingue pas une RAM minimale d'une RAM recommandée : l'unique seuil
        // RAM fait donc partie des deux verdicts, afin d'éviter un "recommandé" incohérent.
        var meetsReco = gpuScore >= req.RecoGpuScore && cpuScore >= req.RecoCpuScore && ramGb >= req.MinRamGb;

        string verdict = meetsReco ? "Ça tourne (recommandé)"
            : meetsMin ? "Ça tourne (minimum)"
            : "Trop faible";

        return new ScoreResult
        {
            EstimatedFps = fps,
            GamingPerformance = gaming,
            CpuPower = cpuScore,
            VisualQuality = VisualQuality(gpuScore, req),
            BottleneckPenalty = BottleneckPenalty(gpuScore, cpuScore),
            PriceValue = PriceValue(gaming, totalPrice),
            MeetsMinimum = meetsMin,
            MeetsRecommended = meetsReco,
            Verdict = verdict
        };
    }
}

public class ScoreResult
{
    public int EstimatedFps { get; set; }
    public int GamingPerformance { get; set; }
    public int CpuPower { get; set; }
    public string VisualQuality { get; set; } = "";
    public int BottleneckPenalty { get; set; }
    public double PriceValue { get; set; }
    public bool MeetsMinimum { get; set; }
    public bool MeetsRecommended { get; set; }
    public string Verdict { get; set; } = "";
}
