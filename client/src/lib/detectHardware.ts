import type { Product } from '../api/types';

export interface DetectedHardware {
  /** Modèle GPU nettoyé (ex. « GeForce RTX 4090 »), ou null si le navigateur le masque. */
  gpu: string | null;
  /** Chaîne WebGL brute (pour debug/affichage). */
  gpuRaw: string | null;
  /** Nombre de cœurs logiques (navigator.hardwareConcurrency). */
  cores: number | null;
  /** RAM approximative en Go (navigator.deviceMemory ; absent hors Chrome/Edge). */
  ramGb: number | null;
}

/** Nettoie la chaîne WebGL brute pour en extraire le modèle GPU lisible. */
export function cleanGpuRenderer(raw: string): string {
  let s = raw;
  // Déballe le wrapper ANGLE : "ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 ..., D3D11)".
  const angle = s.match(/^ANGLE \((.*)\)$/i);
  if (angle) {
    const parts = angle[1].split(',').map((p) => p.trim());
    // Segment qui contient une FAMILLE/MODÈLE de GPU (pas un simple nom de fabricant « NVIDIA »).
    s = parts.find((p) => /geforce|radeon|\barc\b|rtx|gtx|\brx\s*\d/i.test(p)) ?? parts[1] ?? parts[0];
  }
  // Retire les suffixes techniques (API, versions de shaders, etc.).
  s = s.replace(/\b(Direct3D11|Direct3D9|OpenGL|Metal|Vulkan|vs_\d_\d|ps_\d_\d|\(0x[0-9A-Fa-f]+\))\b.*$/i, '');
  return s.replace(/\s+/g, ' ').trim();
}

/** Lit le matériel accessible depuis le navigateur (best-effort). */
export function detectHardware(): DetectedHardware {
  let gpu: string | null = null;
  let gpuRaw: string | null = null;
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (gl) {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) {
        const r = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
        if (r) { gpuRaw = String(r); gpu = cleanGpuRenderer(gpuRaw); }
      }
    }
  } catch { /* WebGL indisponible */ }

  const cores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : null;
  const dm = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const ramGb = typeof dm === 'number' ? dm : null;

  return { gpu, gpuRaw, cores, ramGb };
}

const normalize = (s: string) =>
  s.toLowerCase()
    .replace(/nvidia|geforce|amd|radeon|intel|\(r\)|\(tm\)|graphics|laptop|series/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Associe un nom de composant (GPU ou CPU) au catalogue par recouvrement de tokens ;
 * un token numérique commun (ex. « 4090 ») pèse davantage. null si aucune correspondance nette.
 */
function matchByName(model: string, products: Product[]): Product | null {
  if (!model || products.length === 0) return null;
  const tokens = new Set(normalize(model).split(' ').filter(Boolean));
  if (tokens.size === 0) return null;

  let best: Product | null = null;
  let bestScore = 0;
  for (const p of products) {
    const catTokens = normalize(p.name).split(' ').filter(Boolean);
    let score = 0;
    for (const t of catTokens) {
      if (tokens.has(t)) score += /^\d+$/.test(t) ? 3 : 1; // le numéro de modèle prime
    }
    if (score > bestScore) { bestScore = score; best = p; }
  }
  // Exige au moins un token significatif partagé (dont idéalement le numéro).
  return bestScore >= 3 ? best : null;
}

/** Associe un modèle GPU détecté au composant catalogue le plus proche. */
export const matchGpuToCatalog = matchByName;

/**
 * Nettoie un nom de CPU brut renvoyé par Windows (WMI) — retire la fréquence
 * (« @ 3.50GHz »), les mentions marketing et « with Radeon Graphics » — pour un meilleur matching.
 */
export function cleanCpuName(raw: string): string {
  return raw
    .replace(/@.*/, '')                          // « @ 3.50GHz » et tout ce qui suit
    .replace(/\bwith\s+radeon\s+graphics\b/i, '')
    .replace(/\b\d+[-\s]?core\b/i, '')           // « 6-Core », « 8 Core »
    .replace(/\b(cpu|processor)\b/gi, '')
    .replace(/\(r\)|\(tm\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Associe un nom de CPU (nettoyé) au composant catalogue le plus proche. */
export function matchCpuToCatalog(name: string, cpus: Product[]): Product | null {
  return matchByName(cleanCpuName(name), cpus);
}

/** Lit le nombre de cœurs d'un CPU catalogue depuis ses specs JSON. */
function cpuCores(p: Product): number {
  try {
    const c = (JSON.parse(p.specs ?? '{}') as { Cores?: number | string }).Cores;
    return typeof c === 'number' ? c : parseInt(String(c ?? ''), 10) || 0;
  } catch { return 0; }
}

/** CPU catalogue dont le nombre de cœurs est le plus proche du détecté (tie-break : perfScore médian). */
export function matchCpuByCores(cores: number, cpus: Product[]): Product | null {
  if (!cores || cpus.length === 0) return null;
  const withCores = cpus.filter((c) => cpuCores(c) > 0);
  const pool = withCores.length ? withCores : cpus;
  return [...pool].sort((a, b) => {
    const da = Math.abs(cpuCores(a) - cores);
    const db = Math.abs(cpuCores(b) - cores);
    if (da !== db) return da - db;
    return b.perfScore - a.perfScore;
  })[0] ?? null;
}

/** Arrondit une RAM détectée au palier proposé le plus proche (8/16/32/64). */
export function nearestRam(gb: number | null): number {
  const tiers = [8, 16, 32, 64];
  if (!gb) return 16;
  // `<=` → en cas d'égalité de distance, on arrondit vers le palier supérieur (ne pas sous-estimer la RAM).
  return tiers.reduce((best, t) => (Math.abs(t - gb) <= Math.abs(best - gb) ? t : best), tiers[0]);
}

/** Matériel réel lu par l'outil `detect-pc.ps1` et transporté via le code `FF1-…`. */
export interface PcSpecs {
  gpu: string;
  cpu: string;
  cores: number;
  ram: number;
}

/**
 * Décode le code `FF1-<base64url(JSON)>` produit par l'outil de détection local.
 * Retourne les specs réelles du PC, ou null si le code est invalide/malformé.
 */
export function decodePcCode(code: string): PcSpecs | null {
  const m = code.trim().match(/^FF1-([A-Za-z0-9\-_]+)$/);
  if (!m) return null;
  let b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  try {
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const obj = JSON.parse(new TextDecoder().decode(bytes)) as Partial<PcSpecs>;
    if (typeof obj.gpu !== 'string' || typeof obj.cpu !== 'string') return null;
    return {
      gpu: obj.gpu,
      cpu: obj.cpu,
      cores: Number(obj.cores) || 0,
      ram: Number(obj.ram) || 0,
    };
  } catch {
    return null; // base64 ou JSON invalide
  }
}
