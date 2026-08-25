import { describe, expect, it } from 'vitest';
import {
  cleanGpuRenderer, cleanCpuName, decodePcCode, matchGpuToCatalog,
  matchCpuToCatalog, matchCpuByCores, nearestRam,
} from './detectHardware';
import type { PcSpecs } from './detectHardware';
import type { Product } from '../api/types';

/** Encode des specs comme le fait l'outil PowerShell (JSON → base64url, préfixe FF1-). */
function encodePcCode(specs: PcSpecs): string {
  const json = JSON.stringify(specs);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `FF1-${b64}`;
}

function gpu(id: number, name: string): Product {
  return { id, name, brand: '', price: 0, stock: 1, description: '', perfScore: 50, categoryId: 1,
    categoryName: '', categorySlug: 'gpu', averageRating: 0, reviewCount: 0 };
}
function cpu(id: number, name: string, cores: number, perf: number): Product {
  return { id, name, brand: '', price: 0, stock: 1, description: '', perfScore: perf, categoryId: 2,
    categoryName: '', categorySlug: 'cpu', specs: JSON.stringify({ Cores: cores }), averageRating: 0, reviewCount: 0 };
}

describe('cleanGpuRenderer', () => {
  it('unwraps ANGLE and strips driver suffixes', () => {
    const raw = 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)';
    expect(cleanGpuRenderer(raw)).toContain('GeForce RTX 4090');
    expect(cleanGpuRenderer(raw)).not.toContain('Direct3D11');
  });
  it('leaves a plain renderer mostly intact', () => {
    expect(cleanGpuRenderer('AMD Radeon RX 7900 XTX')).toBe('AMD Radeon RX 7900 XTX');
  });
});

describe('matchGpuToCatalog', () => {
  const catalog = [gpu(1, 'GeForce RTX 4090'), gpu(2, 'GeForce RTX 4080'), gpu(3, 'Radeon RX 7900 XTX')];
  it('matches by model number', () => {
    expect(matchGpuToCatalog('NVIDIA GeForce RTX 4090', catalog)?.id).toBe(1);
    expect(matchGpuToCatalog('Radeon RX 7900 XTX', catalog)?.id).toBe(3);
  });
  it('returns null when nothing meaningful matches', () => {
    expect(matchGpuToCatalog('Intel HD Graphics 620', catalog)).toBeNull();
  });
});

describe('matchCpuByCores', () => {
  const catalog = [cpu(1, 'i3', 4, 40), cpu(2, 'i5', 6, 60), cpu(3, 'i9', 24, 90)];
  it('picks the CPU with the closest core count', () => {
    expect(matchCpuByCores(20, catalog)?.id).toBe(3);
    expect(matchCpuByCores(5, catalog)?.id).toBe(2);
  });
});

describe('cleanCpuName', () => {
  it('strips clock speed, marketing and core-count noise', () => {
    expect(cleanCpuName('Intel(R) Core(TM) i5-14600K CPU @ 3.50GHz')).toBe('Intel Core i5-14600K');
    expect(cleanCpuName('AMD Ryzen 5 5600X 6-Core Processor')).toBe('AMD Ryzen 5 5600X');
  });
});

describe('matchCpuToCatalog', () => {
  const catalog = [
    cpu(1, 'Intel Core i5-14600K', 14, 80),
    cpu(2, 'AMD Ryzen 5 5600X', 6, 70),
    cpu(3, 'AMD Ryzen 9 7950X', 16, 95),
  ];
  it('matches a raw Windows CPU name to the catalog', () => {
    expect(matchCpuToCatalog('Intel(R) Core(TM) i5-14600K CPU @ 3.50GHz', catalog)?.id).toBe(1);
    expect(matchCpuToCatalog('AMD Ryzen 5 5600X 6-Core Processor', catalog)?.id).toBe(2);
  });
});

describe('decodePcCode', () => {
  it('round-trips specs from the detection tool', () => {
    const code = encodePcCode({ gpu: 'NVIDIA GeForce RTX 4070', cpu: 'AMD Ryzen 5 5600X', cores: 6, ram: 16 });
    const decoded = decodePcCode(code);
    expect(decoded).toEqual({ gpu: 'NVIDIA GeForce RTX 4070', cpu: 'AMD Ryzen 5 5600X', cores: 6, ram: 16 });
  });
  it('accepts whitespace around the code', () => {
    const code = encodePcCode({ gpu: 'A', cpu: 'B', cores: 4, ram: 8 });
    expect(decodePcCode(`  ${code}\n`)?.cores).toBe(4);
  });
  it('rejects malformed or non-FrameForge codes', () => {
    expect(decodePcCode('')).toBeNull();
    expect(decodePcCode('hello')).toBeNull();
    expect(decodePcCode('FF1-@@@notbase64@@@')).toBeNull();
  });
});

describe('nearestRam', () => {
  it('rounds to the nearest tier', () => {
    expect(nearestRam(8)).toBe(8);
    expect(nearestRam(12)).toBe(16);
    expect(nearestRam(48)).toBe(64);
    expect(nearestRam(null)).toBe(16);
  });
});
