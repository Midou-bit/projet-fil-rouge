import { describe, expect, it } from 'vitest';
import type { Product } from '../api/types';
import { buildCoherent, checkCompatibility, coherentFrom, type ByCat } from './compatibility';

function product(
  id: number,
  categorySlug: string,
  price: number,
  perfScore: number,
  values: Record<string, string | number> = {},
  stock = 5,
): Product {
  return {
    id,
    name: `${categorySlug}-${id}`,
    brand: 'FrameForge Test',
    price,
    stock,
    description: 'Fixture de test',
    perfScore,
    specs: JSON.stringify(values),
    categoryId: id,
    categoryName: categorySlug,
    categorySlug,
    averageRating: 0,
    reviewCount: 0,
  };
}

function catalog(): ByCat {
  return {
    cpu: [
      product(1, 'cpu', 90, 55, { Socket: 'LGA1200' }),
      product(2, 'cpu', 120, 70, { Socket: 'AM4' }),
      product(3, 'cpu', 220, 95, { Socket: 'AM5' }),
    ],
    'carte-mere': [
      product(10, 'carte-mere', 110, 50, { Socket: 'AM4', Ram: 'DDR4' }),
      product(11, 'carte-mere', 180, 80, { Socket: 'AM5', Ram: 'DDR5' }),
    ],
    ram: [
      product(20, 'ram', 50, 50, { Type: 'DDR4', Capacity: '16 GB' }),
      product(21, 'ram', 80, 80, { Type: 'DDR5', Capacity: '32 GB' }),
    ],
    gpu: [
      product(30, 'gpu', 200, 60, { Tdp: '200 W' }),
      product(31, 'gpu', 500, 95, { Tdp: '350 W' }),
    ],
    alimentation: [
      product(40, 'alimentation', 45, 45, { Wattage: '450 W' }),
      product(41, 'alimentation', 90, 80, { Wattage: '750 W' }),
    ],
    stockage: [product(50, 'stockage', 40, 50), product(51, 'stockage', 100, 90)],
    boitier: [product(60, 'boitier', 60, 50), product(61, 'boitier', 140, 85)],
  };
}

describe('buildCoherent', () => {
  it('compose un build budget cohérent sans choisir un CPU orphelin', () => {
    const selected = buildCoherent(catalog(), 'budget');

    expect(selected).toEqual({
      cpu: 2,
      'carte-mere': 10,
      ram: 20,
      gpu: 30,
      alimentation: 41,
      stockage: 50,
      boitier: 60,
    });
  });

  it('privilégie la performance tout en conservant socket, RAM et alimentation cohérents', () => {
    const selected = buildCoherent(catalog(), 'perf');

    expect(selected.cpu).toBe(3);
    expect(selected['carte-mere']).toBe(11);
    expect(selected.ram).toBe(21);
    expect(selected.gpu).toBe(31);
    expect(selected.alimentation).toBe(41);
    expect(selected.stockage).toBe(51);
    expect(selected.boitier).toBe(61);
  });

  it('gère un catalogue partiel et les specs invalides sans lever d’exception', () => {
    const broken = product(70, 'cpu', 0, 80);
    broken.specs = '{invalid';

    expect(buildCoherent({ cpu: [broken] }, 'balanced')).toEqual({ cpu: 70 });
    expect(buildCoherent({}, 'budget')).toEqual({});
  });
});

describe('coherentFrom', () => {
  it('réaligne les pièces support en conservant un CPU et un GPU compatibles', () => {
    const selected = coherentFrom(
      { cpu: 2, gpu: 31, 'carte-mere': 11, ram: 21, alimentation: 40 },
      catalog(),
    );

    expect(selected.cpu).toBe(2);
    expect(selected.gpu).toBe(31);
    expect(selected['carte-mere']).toBe(10);
    expect(selected.ram).toBe(20);
    expect(selected.alimentation).toBe(41);
  });

  it('remplace un CPU orphelin par le moins cher compatible avec une carte mère disponible', () => {
    const selected = coherentFrom({ cpu: 1 }, catalog());

    expect(selected['carte-mere']).toBe(10);
    expect(selected.cpu).toBe(2);
    expect(selected.ram).toBe(20);
  });

  it('conserve la sélection lorsqu’aucune pièce pertinente n’est trouvée', () => {
    expect(coherentFrom({ cpu: 999, gpu: 999 }, {})).toEqual({ cpu: 999, gpu: 999 });
  });
});

describe('checkCompatibility', () => {
  it('valide un assemblage compatible', () => {
    const byCat = catalog();
    const parts = [byCat.cpu[1], byCat['carte-mere'][0], byCat.ram[0], byCat.gpu[0], byCat.alimentation[1]];

    expect(checkCompatibility(parts)).toEqual([
      expect.objectContaining({ ok: true, label: 'Socket CPU / carte mère', detail: 'AM4 ✓' }),
      expect.objectContaining({ ok: true, label: 'Mémoire / carte mère', detail: 'DDR4 ✓' }),
      expect.objectContaining({ ok: true, label: 'Alimentation' }),
    ]);
  });

  it('explique chaque incompatibilité et propose le substitut compatible le moins cher', () => {
    const byCat = catalog();
    const parts = [byCat.cpu[1], byCat['carte-mere'][1], byCat.ram[0], byCat.gpu[1], byCat.alimentation[0]];
    const checks = checkCompatibility(parts, byCat);

    expect(checks).toHaveLength(3);
    expect(checks[0]).toMatchObject({ ok: false, fix: { slug: 'carte-mere', product: { id: 10 } } });
    expect(checks[0].explain).toContain('même « socket »');
    expect(checks[1]).toMatchObject({ ok: false, fix: { slug: 'ram', product: { id: 21 } } });
    expect(checks[1].explain).toContain('même type');
    expect(checks[2]).toMatchObject({ ok: false, fix: { slug: 'alimentation', product: { id: 41 } } });
    expect(checks[2].explain).toContain('marge de sécurité');
  });

  it('propose un CPU compatible lorsque le socket du CPU ne possède aucune carte mère', () => {
    const byCat = catalog();
    const checks = checkCompatibility([byCat.cpu[0], byCat['carte-mere'][0]], byCat);

    expect(checks[0]).toMatchObject({ ok: false, fix: { slug: 'cpu', product: { id: 2 } } });
  });

  it('ignore les contrôles dont les composants ou les specs sont absents', () => {
    expect(checkCompatibility([])).toEqual([]);
    expect(checkCompatibility([product(99, 'cpu', 100, 50, {})])).toEqual([]);
  });
});
