namespace api.Models;

public class Game
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int ReleaseYear { get; set; }

    /// <summary>Genre principal (issu de FreeToGame quand importé, ex. "Shooter", "RPG").</summary>
    public string? Genre { get; set; }
    /// <summary>Note Metacritic 0-100 (renseignée pour les jeux curatés hors-ligne), null si inconnue.</summary>
    public int? Metacritic { get; set; }

    public List<GameRequirement> Requirements { get; set; } = new();
}

public class GameRequirement
{
    public int Id { get; set; }
    public int GameId { get; set; }
    public Game? Game { get; set; }

    /// <summary>1080p / 1440p / 4K</summary>
    public string Resolution { get; set; } = "1080p";

    /// <summary>60 / 144</summary>
    public int TargetFps { get; set; }

    public int MinGpuScore { get; set; }
    public int RecoGpuScore { get; set; }
    public int MinCpuScore { get; set; }
    public int RecoCpuScore { get; set; }
    public int MinRamGb { get; set; }
}
