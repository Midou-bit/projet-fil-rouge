import type { ScoreSummary } from '../api/types';
import StatBar from './StatBar';

const QUALITY_PCT: Record<string, number> = { Moyen: 45, 'Élevé': 75, Ultra: 100, '—': 0 };

/** Panneau de stats animées : les 5 barres façon CoD à partir d'un ScoreSummary. */
export default function StatPanel({ score, fpsScale = 144 }: { score: ScoreSummary; fpsScale?: number }) {
  const fpsPct = Math.min(100, (score.estimatedFps / fpsScale) * 100);
  const fpsTone = score.estimatedFps >= 60 ? 'cyan' : score.estimatedFps >= 30 ? 'warning' : 'danger';
  const valuePct = Math.min(100, score.priceValue * 12); // ~8/100€ = plein

  return (
    <div className="stack">
      <StatBar
        icon="🎮"
        label="Performance gaming"
        display={`${score.gamingPerformance}/100`}
        percent={score.gamingPerformance}
        tone={score.gamingPerformance >= 50 ? 'cyan' : 'danger'}
      />
      <StatBar icon="⚡" label="Puissance CPU" display={`${score.cpuPower}/100`} percent={score.cpuPower} />
      <StatBar
        icon="🎨"
        label="Qualité visuelle"
        display={score.visualQuality}
        percent={QUALITY_PCT[score.visualQuality] ?? 0}
        tone="warning"
      />
      {score.estimatedFps > 0 && (
        <StatBar
          icon="📺"
          label="FPS estimés"
          display={`${score.estimatedFps} fps`}
          percent={fpsPct}
          tone={fpsTone}
        />
      )}
      <StatBar
        icon="💰"
        label="Rapport qualité/prix"
        display={score.priceValue.toFixed(1)}
        percent={valuePct}
        tone="cyan"
      />
      {score.bottleneckPenalty > 0 && (
        <p className="muted" style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
          ⚠ Bottleneck détecté : −{score.bottleneckPenalty} pts (CPU et GPU déséquilibrés).
        </p>
      )}
    </div>
  );
}
