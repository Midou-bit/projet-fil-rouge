import { describe, expect, it } from 'vitest';
import { evaluate, gamingPerformance, bottleneckPenalty, resolutionFactor } from './scoring';
import type { GameRequirement } from '../api/types';

const req = (over: Partial<GameRequirement> = {}): GameRequirement => ({
  id: 1, resolution: '1080p', targetFps: 60,
  minGpuScore: 45, recoGpuScore: 70, minCpuScore: 40, recoCpuScore: 60, minRamGb: 16, ...over,
});

describe('scoring helpers', () => {
  it('resolutionFactor drops with resolution', () => {
    expect(resolutionFactor('1080p')).toBe(1);
    expect(resolutionFactor('1440p')).toBe(0.7);
    expect(resolutionFactor('4K')).toBe(0.45);
  });
  it('bottleneckPenalty only past the 25-point gap', () => {
    expect(bottleneckPenalty(80, 78)).toBe(0);
    expect(bottleneckPenalty(90, 50)).toBe(9); // (40-25)*0.6
  });
  it('gamingPerformance weights GPU 70 / CPU 30 and clamps', () => {
    expect(gamingPerformance(80, 80)).toBe(80);
    expect(gamingPerformance(0, 0)).toBe(0);
  });
});

describe('evaluate', () => {
  it('flags integrated laptop hardware as too weak for a demanding game', () => {
    const r = evaluate(10, 42, 8, req({ minRamGb: 16, recoGpuScore: 75 }));
    expect(r.verdict).toBe('Trop faible');
    expect(r.meetsMinimum).toBe(false);
  });
  it('passes recommended when both scores clear the bar', () => {
    const r = evaluate(80, 75, 16, req());
    expect(r.meetsRecommended).toBe(true);
    expect(r.verdict).toBe('Ça tourne (recommandé)');
  });
  it('passes minimum but not recommended in between', () => {
    const r = evaluate(50, 50, 16, req());
    expect(r.meetsMinimum).toBe(true);
    expect(r.meetsRecommended).toBe(false);
    expect(r.verdict).toBe('Ça tourne (minimum)');
  });
});
