import type { GameRequirement, ScoreSummary } from '../api/types';

/**
 * Réplique fidèle (côté client) de `ScoringService` du backend, pour pouvoir estimer le verdict
 * d'un matériel qui n'est PAS dans le catalogue (carte intégrée, portable…) sans appel serveur.
 * ⚠️ Doit rester synchronisé avec api/Services/ScoringService.cs.
 */

const BOTTLENECK_GAP = 25;

export function bottleneckPenalty(gpuScore: number, cpuScore: number): number {
  const gap = Math.abs(gpuScore - cpuScore);
  if (gap <= BOTTLENECK_GAP) return 0;
  return Math.round((gap - BOTTLENECK_GAP) * 0.6);
}

export function gamingPerformance(gpuScore: number, cpuScore: number): number {
  const weighted = gpuScore * 0.7 + cpuScore * 0.3;
  const score = weighted - bottleneckPenalty(gpuScore, cpuScore);
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function estimateFps(gpuScore: number, cpuScore: number, req: GameRequirement): number {
  // Les seuils de chaque requirement sont déjà propres à sa résolution et sa cible FPS.
  // Réappliquer ici un coefficient de résolution ferait compter la difficulté deux fois.
  const fpsGpuBound = (gpuScore / Math.max(1, req.recoGpuScore)) * req.targetFps;
  const fpsCpuBound = (cpuScore / Math.max(1, req.recoCpuScore)) * req.targetFps;
  return Math.round(Math.min(fpsGpuBound, fpsCpuBound));
}

export function visualQuality(gpuScore: number, req: GameRequirement): string {
  const margin = gpuScore / req.recoGpuScore;
  if (margin >= 1.15) return 'Ultra';
  if (margin >= 0.85) return 'Élevé';
  return 'Moyen';
}

/** Verdict complet pour un couple (GPU, CPU, RAM) face aux prérequis d'un jeu. */
export function evaluate(gpuScore: number, cpuScore: number, ramGb: number, req: GameRequirement): ScoreSummary {
  const meetsMinimum = gpuScore >= req.minGpuScore && cpuScore >= req.minCpuScore && ramGb >= req.minRamGb;
  const meetsRecommended = gpuScore >= req.recoGpuScore && cpuScore >= req.recoCpuScore && ramGb >= req.minRamGb;
  const verdict = meetsRecommended ? 'Ça tourne (recommandé)'
    : meetsMinimum ? 'Ça tourne (minimum)'
    : 'Trop faible';

  return {
    estimatedFps: estimateFps(gpuScore, cpuScore, req),
    gamingPerformance: gamingPerformance(gpuScore, cpuScore),
    cpuPower: cpuScore,
    visualQuality: visualQuality(gpuScore, req),
    bottleneckPenalty: bottleneckPenalty(gpuScore, cpuScore),
    priceValue: 0, // sans prix (matériel déjà possédé)
    meetsMinimum,
    meetsRecommended,
    verdict,
  };
}
