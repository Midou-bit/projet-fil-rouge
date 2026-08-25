import { cleanCpuName } from './detectHardware';

/**
 * Table de puissance APPROXIMATIVE (échelle 0-100, alignée sur les `perfScore` du catalogue :
 * ex. RTX 4060 Ti = 65, RTX 4090 = 98, Celeron G5900 = 44) pour du matériel COURANT
 * qui n'est PAS vendu en boutique : cartes graphiques intégrées, puces de portable,
 * générations plus anciennes. Objectif : le Vérificateur peut estimer N'IMPORTE quel PC,
 * pas seulement ce qu'on vend. Valeurs indicatives (tiers), pas des benchmarks réels.
 */

interface Rule { re: RegExp; score: number }

/** Renvoie le score de la 1ʳᵉ règle qui matche (ordre = spécifique → générique), sinon null. */
function firstMatch(text: string, rules: Rule[]): number | null {
  for (const r of rules) if (r.re.test(text)) return r.score;
  return null;
}

// --- Cartes graphiques ------------------------------------------------------
const GPU_RULES: Rule[] = [
  // Intégrés récents (RDNA2/3 dans les APU Ryzen)
  { re: /\b780m\b/, score: 30 },
  { re: /\b760m\b/, score: 20 },
  { re: /\b680m\b/, score: 24 },
  { re: /\b660m\b/, score: 18 },
  // Intel intégré
  { re: /iris\s*xe/, score: 16 },
  { re: /iris/, score: 12 },
  { re: /(uhd|hd)\s*graphics/, score: 5 },
  // AMD Vega intégré (Ryzen U/G)
  { re: /vega\s*11/, score: 15 },
  { re: /vega\s*(8|9|10)/, score: 13 },
  { re: /vega\s*(6|7)/, score: 11 },
  { re: /vega\s*(3|4|5)/, score: 8 },
  // Apple (peu probable via l'outil Windows, mais sans risque)
  { re: /apple m3/, score: 44 }, { re: /apple m2/, score: 38 }, { re: /apple m1/, score: 32 },
  // NVIDIA GeForce dédiées hors catalogue
  { re: /rtx\s*4060(?!\s*ti)/, score: 60 }, { re: /rtx\s*4050/, score: 52 },
  { re: /rtx\s*3060\s*ti/, score: 68 }, { re: /rtx\s*3070\s*ti/, score: 72 },
  { re: /rtx\s*3060/, score: 60 }, { re: /rtx\s*3050/, score: 48 },
  { re: /rtx\s*2080\s*ti/, score: 76 }, { re: /rtx\s*2080/, score: 70 },
  { re: /rtx\s*2070/, score: 64 }, { re: /rtx\s*2060/, score: 56 },
  { re: /gtx\s*1080\s*ti/, score: 62 }, { re: /gtx\s*1080/, score: 56 },
  { re: /gtx\s*1070\s*ti/, score: 54 }, { re: /gtx\s*1070/, score: 50 },
  { re: /gtx\s*1660\s*ti/, score: 52 }, { re: /gtx\s*1660\s*super/, score: 50 }, { re: /gtx\s*1660/, score: 46 },
  { re: /gtx\s*1650\s*super/, score: 42 }, { re: /gtx\s*1650/, score: 35 },
  { re: /gtx\s*1060/, score: 40 }, { re: /gtx\s*1050\s*ti/, score: 30 }, { re: /gtx\s*1050/, score: 26 },
  { re: /gt\s*1030/, score: 12 }, { re: /gtx\s*750\s*ti/, score: 18 },
  { re: /mx\d{3}/, score: 14 }, // GeForce MX (portables entrée de gamme)
  // AMD Radeon RX dédiées hors catalogue
  { re: /rx\s*6750\s*xt/, score: 70 }, { re: /rx\s*6700(?!\s*xt)/, score: 64 }, { re: /rx\s*6700\s*xt/, score: 66 },
  { re: /rx\s*6650\s*xt/, score: 64 }, { re: /rx\s*6600\s*xt/, score: 62 }, { re: /rx\s*6600/, score: 56 },
  { re: /rx\s*6500/, score: 40 }, { re: /rx\s*7600/, score: 58 },
  { re: /rx\s*5700\s*xt/, score: 64 }, { re: /rx\s*5700/, score: 60 }, { re: /rx\s*5600/, score: 55 },
  { re: /rx\s*5500/, score: 46 }, { re: /rx\s*590/, score: 44 }, { re: /rx\s*580/, score: 42 },
  { re: /rx\s*570/, score: 38 }, { re: /rx\s*480/, score: 42 }, { re: /rx\s*470/, score: 36 },
  // Générique : « AMD Radeon(TM) Graphics » sans numéro = iGPU d'APU Ryzen bas de gamme (ex. 4500U → Vega 6)
  { re: /radeon(\s*\(tm\))?\s*graphics/, score: 10 },
];

// --- Processeurs ------------------------------------------------------------
const CPU_RULES: Rule[] = [
  // AMD Ryzen mobile (suffixes U / H / HS / HX)
  { re: /ryzen\s*9\s*\d{4}h[xs]?/, score: 80 }, { re: /ryzen\s*7\s*(78|76)\d0h[xs]?/, score: 82 },
  { re: /ryzen\s*7\s*58\d0h[xs]?/, score: 72 }, { re: /ryzen\s*7\s*\d{4}h[xs]?/, score: 68 },
  { re: /ryzen\s*5\s*(56|76|78)\d0h[xs]?/, score: 64 }, { re: /ryzen\s*5\s*\d{4}h[xs]?/, score: 58 },
  { re: /ryzen\s*7\s*\d{4}u/, score: 52 }, { re: /ryzen\s*5\s*55\d0u/, score: 46 },
  { re: /ryzen\s*5\s*45\d0u/, score: 42 }, { re: /ryzen\s*5\s*\d{4}u/, score: 44 },
  { re: /ryzen\s*3\s*\d{4}u/, score: 34 },
  // AMD Ryzen desktop hors catalogue
  { re: /ryzen\s*7\s*5800x/, score: 82 }, { re: /ryzen\s*7\s*5700x/, score: 80 }, { re: /ryzen\s*7\s*3700x/, score: 68 },
  { re: /ryzen\s*7\s*2700x?/, score: 58 }, { re: /ryzen\s*5\s*5600x/, score: 76 }, { re: /ryzen\s*5\s*5600(?!x)/, score: 72 },
  { re: /ryzen\s*5\s*3600x/, score: 56 }, { re: /ryzen\s*5\s*2600/, score: 50 }, { re: /ryzen\s*5\s*1600/, score: 42 },
  { re: /ryzen\s*3\s*3300x/, score: 52 }, { re: /ryzen\s*3\s*3100/, score: 44 },
  // Intel Core mobile
  { re: /i9-\d{4,5}h[xk]?/, score: 82 }, { re: /i7-12\d{3}h/, score: 80 }, { re: /i7-11\d{3}h/, score: 70 },
  { re: /i7-10\d{3}h/, score: 58 }, { re: /i7-\d{4}u|i7-1\d{3}g\d/, score: 50 },
  { re: /i5-12\d{3}h/, score: 66 }, { re: /i5-10\d{3}h/, score: 50 }, { re: /i5-\d{4}u|i5-1\d{3}g\d/, score: 46 },
  { re: /i3-\d{4}u/, score: 36 },
  // Intel Core desktop hors catalogue
  { re: /i9-9900k/, score: 80 }, { re: /i7-10700k/, score: 78 }, { re: /i7-9700k/, score: 74 },
  { re: /i7-8700k?/, score: 66 }, { re: /i7-7700k?/, score: 52 }, { re: /i5-11400f?/, score: 66 },
  { re: /i5-10400f?/, score: 62 }, { re: /i5-9400f?/, score: 58 }, { re: /i5-8400/, score: 56 },
  { re: /i5-7400/, score: 40 }, { re: /i5-6600k?/, score: 44 }, { re: /i3-8100/, score: 44 },
  { re: /pentium|celeron/, score: 30 }, { re: /\bfx-8\d{3}\b/, score: 28 },
];

/** Score de puissance estimé d'une carte graphique (nom brut du système), ou null si inconnue. */
export function gpuScoreFor(model: string): number | null {
  return firstMatch(model.toLowerCase(), GPU_RULES);
}

/** Score de puissance estimé d'un processeur (nom brut du système), ou null si inconnu. */
export function cpuScoreFor(name: string): number | null {
  return firstMatch(cleanCpuName(name).toLowerCase(), CPU_RULES);
}
