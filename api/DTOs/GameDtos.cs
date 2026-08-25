using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

public class GameRequirementDto
{
    public int Id { get; set; }
    public string Resolution { get; set; } = string.Empty;
    public int TargetFps { get; set; }
    public int MinGpuScore { get; set; }
    public int RecoGpuScore { get; set; }
    public int MinCpuScore { get; set; }
    public int RecoCpuScore { get; set; }
    public int MinRamGb { get; set; }
}

public class GameDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int ReleaseYear { get; set; }
    public string? Genre { get; set; }
    public int? Metacritic { get; set; }
    public List<GameRequirementDto> Requirements { get; set; } = new();
}

/// <summary>Mode "je veux jouer à X" : build recommandé pour un jeu/résolution/fps.</summary>
public class BuildRecommendationDto
{
    public GameDto Game { get; set; } = new();
    public string Resolution { get; set; } = "1080p";
    public int TargetFps { get; set; } = 60;
    public List<ProductDto> Parts { get; set; } = new();
    public decimal TotalPrice { get; set; }
    public ScoreSummaryDto Score { get; set; } = new();
}

/// <summary>Vérificateur : { cpuId, gpuId, gameId, resolution, fps }.</summary>
public class CheckRequestDto
{
    [Required] public int CpuId { get; set; }
    [Required] public int GpuId { get; set; }
    [Required] public int GameId { get; set; }
    public string Resolution { get; set; } = "1080p";
    public int TargetFps { get; set; } = 60;
    public int RamGb { get; set; } = 16;
}

public class CheckResultDto
{
    public string GameTitle { get; set; } = string.Empty;
    public string Resolution { get; set; } = string.Empty;
    public int TargetFps { get; set; }
    public ScoreSummaryDto Score { get; set; } = new();
    /// <summary>Si "trop faible", composant GPU conseillé en upgrade (avec lien d'achat).</summary>
    public ProductDto? SuggestedGpuUpgrade { get; set; }
    public ProductDto? SuggestedCpuUpgrade { get; set; }
}

/// <summary>Les barres de stats façon CoD — partagées builder/vérificateur.</summary>
public class ScoreSummaryDto
{
    public int EstimatedFps { get; set; }
    public int GamingPerformance { get; set; }
    public int CpuPower { get; set; }
    public string VisualQuality { get; set; } = string.Empty;
    public int BottleneckPenalty { get; set; }
    public double PriceValue { get; set; }
    public bool MeetsMinimum { get; set; }
    public bool MeetsRecommended { get; set; }
    public string Verdict { get; set; } = string.Empty;
}

/// <summary>Builder interactif : l'utilisateur envoie sa sélection de composants + jeu visé.</summary>
public class BuildCalcRequestDto
{
    public List<int> ProductIds { get; set; } = new();
    public int? GameId { get; set; }
    public string Resolution { get; set; } = "1080p";
    public int TargetFps { get; set; } = 60;
}
