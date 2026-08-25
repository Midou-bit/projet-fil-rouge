import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StatPanel from './StatPanel';
import type { ScoreSummary } from '../api/types';

const baseScore: ScoreSummary = {
  estimatedFps: 90,
  gamingPerformance: 72,
  cpuPower: 65,
  visualQuality: 'Élevé',
  bottleneckPenalty: 0,
  priceValue: 4.2,
  meetsMinimum: true,
  meetsRecommended: true,
  verdict: 'Ça tourne (recommandé)',
};

describe('StatPanel', () => {
  it('renders the five stat bars from a ScoreSummary', () => {
    render(<StatPanel score={baseScore} />);
    expect(screen.getByText(/Performance gaming/)).toBeInTheDocument();
    expect(screen.getByText('72/100')).toBeInTheDocument();
    expect(screen.getByText(/Puissance CPU/)).toBeInTheDocument();
    expect(screen.getByText(/Qualité visuelle/)).toBeInTheDocument();
    expect(screen.getByText('Élevé')).toBeInTheDocument();
    expect(screen.getByText(/FPS estimés/)).toBeInTheDocument();
    expect(screen.getByText('90 fps')).toBeInTheDocument();
    expect(screen.getByText(/Rapport qualité\/prix/)).toBeInTheDocument();
  });

  it('hides the FPS bar when estimatedFps is 0 (builder without a target game)', () => {
    render(<StatPanel score={{ ...baseScore, estimatedFps: 0 }} />);
    expect(screen.queryByText(/FPS estimés/)).not.toBeInTheDocument();
  });

  it('shows a bottleneck warning only when a penalty is present', () => {
    const { rerender } = render(<StatPanel score={baseScore} />);
    expect(screen.queryByText(/Bottleneck détecté/)).not.toBeInTheDocument();

    rerender(<StatPanel score={{ ...baseScore, bottleneckPenalty: 15 }} />);
    expect(screen.getByText(/Bottleneck détecté/)).toBeInTheDocument();
    expect(screen.getByText(/−15 pts/)).toBeInTheDocument();
  });
});
