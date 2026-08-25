import { describe, expect, it } from 'vitest';
import { gpuScoreFor, cpuScoreFor } from './hardwareScores';

describe('gpuScoreFor', () => {
  it('scores integrated graphics low (the "not in shop" case)', () => {
    // Cas réel remonté par l'outil sur un portable Ryzen 5 4500U.
    expect(gpuScoreFor('AMD Radeon(TM) Graphics')).toBeLessThan(20);
    expect(gpuScoreFor('Intel(R) UHD Graphics 620')).toBeLessThan(15);
    expect(gpuScoreFor('AMD Radeon 780M Graphics')).toBeGreaterThan(gpuScoreFor('AMD Radeon(TM) Graphics')!);
  });
  it('scores older dedicated cards in a sensible range', () => {
    expect(gpuScoreFor('NVIDIA GeForce GTX 1060')).toBeGreaterThan(30);
    expect(gpuScoreFor('NVIDIA GeForce RTX 2060')).toBeGreaterThan(gpuScoreFor('NVIDIA GeForce GTX 1060')!);
  });
  it('returns null for truly unknown hardware', () => {
    expect(gpuScoreFor('SomeUnknown XYZ 9000')).toBeNull();
  });
});

describe('cpuScoreFor', () => {
  it('scores the detected laptop CPU (Ryzen 5 4500U) modestly', () => {
    const s = cpuScoreFor('AMD Ryzen 5 4500U with Radeon Graphics');
    expect(s).not.toBeNull();
    expect(s!).toBeLessThan(55); // portable basse conso < desktop équivalent
  });
  it('parses a raw Intel mobile name', () => {
    expect(cpuScoreFor('Intel(R) Core(TM) i7-10750H CPU @ 2.60GHz')).toBeGreaterThan(40);
  });
});
