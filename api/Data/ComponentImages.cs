namespace api.Data;

/// <summary>
/// Vraies photos de composants (Wikimedia Commons, URLs vérifiées). Représentatives par
/// famille quand le modèle exact n'a pas de photo libre de droits — combinées au placeholder
/// local du front (MediaImage), elles garantissent une image pertinente pour chaque produit.
/// </summary>
public static class ComponentImages
{
    private const string GpuNvidia = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Video_%C3%BCber_die_RTX_4080_Super_und_Vergleichskarten_%28%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan%29_13.png/960px-Video_%C3%BCber_die_RTX_4080_Super_und_Vergleichskarten_%28%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan%29_13.png";
    private const string GpuAmd = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Amd-radeon-rx6800xt-from2020year-back.jpg/960px-Amd-radeon-rx6800xt-from2020year-back.jpg";
    private const string GpuIntel = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Intel_Arc_A770_with_Rubik%27s_Cube-2.jpg/960px-Intel_Arc_A770_with_Rubik%27s_Cube-2.jpg";
    private const string CpuAmd = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/AMD_Ryzen_7_1800X.jpg/960px-AMD_Ryzen_7_1800X.jpg";
    private const string CpuIntel = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/4th_Generation_Intel%C2%AE_Core%E2%84%A2_i7_Processor_Front.jpg/960px-4th_Generation_Intel%C2%AE_Core%E2%84%A2_i7_Processor_Front.jpg";
    private const string RamDdr5 = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/SK_Hynix_DDR5_form_factors.jpg/960px-SK_Hynix_DDR5_form_factors.jpg";
    private const string RamDdr4 = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/16_GiB-DDR4-RAM-Riegel_RAM019FIX_Small_Crop_90_PCNT.png/960px-16_GiB-DDR4-RAM-Riegel_RAM019FIX_Small_Crop_90_PCNT.png";
    private const string SsdNvme = "https://upload.wikimedia.org/wikipedia/commons/5/52/256GB_2230_NVME_SSD_%2B_256GB_NGFF_SSD.jpg";
    private const string SsdSata = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Samsung_870_QVO_8TB_SATA_2%2C5_Zoll_Internes_Solid_State_Drive_%28SSD%29_%28MZ-77Q8T0BW%29_20211008_SSD023_corr.png/960px-Samsung_870_QVO_8TB_SATA_2%2C5_Zoll_Internes_Solid_State_Drive_%28SSD%29_%28MZ-77Q8T0BW%29_20211008_SSD023_corr.png";
    private const string Hdd = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Seagate_ST33232A_hard_disk_inner_view.jpg/960px-Seagate_ST33232A_hard_disk_inner_view.jpg";
    private const string Motherboard = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/2023_Z%C5%82%C4%85cze_zasilania_ATX.jpg/960px-2023_Z%C5%82%C4%85cze_zasilania_ATX.jpg";
    private const string Psu = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/ATX_Computer_power_supply_unit.jpg/960px-ATX_Computer_power_supply_unit.jpg";
    private const string Case = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/PC-Geh%C3%A4use_Kolink_Observatory_RGB_Midi-Tower_20201120_DSC6134.jpg/960px-PC-Geh%C3%A4use_Kolink_Observatory_RGB_Midi-Tower_20201120_DSC6134.jpg";

    /// <summary>Photo réelle pour un produit selon sa catégorie/marque/nom, ou null (→ placeholder front).</summary>
    public static string? For(string categorySlug, string brand, string name)
    {
        var n = name.ToLowerInvariant();
        var b = brand.ToLowerInvariant();
        return categorySlug switch
        {
            "gpu" => b.Contains("intel") || n.Contains("arc") ? GpuIntel
                   : b.Contains("amd") || n.Contains("radeon") ? GpuAmd
                   : GpuNvidia,
            "cpu" => b.Contains("intel") || n.Contains("core") ? CpuIntel : CpuAmd,
            "ram" => n.Contains("ddr4") ? RamDdr4 : RamDdr5,
            "stockage" => n.Contains("hdd") || n.Contains("barracuda") ? Hdd
                        : n.Contains("sata") || n.Contains("mx500") ? SsdSata
                        : SsdNvme,
            "carte-mere" => Motherboard,
            "alimentation" => Psu,
            "boitier" => Case,
            _ => null,
        };
    }
}
