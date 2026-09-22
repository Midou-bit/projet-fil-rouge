import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Game, Product } from '../api/types';

const mocks = vi.hoisted(() => ({
  check: vi.fn(),
  notify: vi.fn(),
  useGames: vi.fn(),
  useProducts: vi.fn(),
}));

vi.mock('../api/endpoints', () => ({ engineApi: { check: mocks.check } }));
vi.mock('../api/queries', () => ({
  useGames: mocks.useGames,
  useProducts: mocks.useProducts,
}));
vi.mock('../components/Toast', () => ({ useToast: () => ({ notify: mocks.notify }) }));

import Checker from './Checker';

const gpu: Product = {
  id: 1,
  name: 'GPU Test',
  brand: 'FrameForge',
  price: 300,
  stock: 1,
  description: 'GPU de test',
  perfScore: 80,
  categoryId: 1,
  categoryName: 'Cartes graphiques',
  categorySlug: 'gpu',
  averageRating: 0,
  reviewCount: 0,
};

const cpu: Product = {
  ...gpu,
  id: 2,
  name: 'CPU Test',
  categoryId: 2,
  categoryName: 'Processeurs',
  categorySlug: 'cpu',
};

const game: Game = {
  id: 3,
  title: 'RAM Quest',
  releaseYear: 2026,
  requirements: [{
    id: 4,
    resolution: '1080p',
    targetFps: 60,
    minGpuScore: 40,
    recoGpuScore: 70,
    minCpuScore: 40,
    recoCpuScore: 70,
    minRamGb: 32,
  }],
};

describe('Checker', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    mocks.check.mockReset();
    mocks.notify.mockReset();
    mocks.useGames.mockReturnValue({ data: [game] });
    mocks.useProducts.mockImplementation(({ category }: { category: string }) => ({
      data: {
        items: category === 'gpu' ? [gpu] : [cpu],
        total: 1,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      },
    }));
  });

  afterEach(() => vi.restoreAllMocks());

  it('n’annonce pas un succès si la recommandation échoue sans upgrade CPU/GPU disponible', async () => {
    mocks.check.mockResolvedValue({
      gameTitle: game.title,
      resolution: '1080p',
      targetFps: 60,
      score: {
        estimatedFps: 60,
        gamingPerformance: 80,
        cpuPower: 80,
        visualQuality: 'Élevé',
        bottleneckPenalty: 0,
        priceValue: 0,
        meetsMinimum: false,
        meetsRecommended: false,
        verdict: 'Trop faible',
      },
      suggestedGpuUpgrade: null,
      suggestedCpuUpgrade: null,
    });

    const replaceState = vi.spyOn(window.history, 'replaceState');
    const detectedCode = 'FF1-eyJncHUiOiJHUFUgVGVzdCIsImNwdSI6IkNQVSBUZXN0IiwiY29yZXMiOjgsInJhbSI6MzJ9';
    render(<MemoryRouter initialEntries={[`/verificateur#pc=${detectedCode}`]}><Checker /></MemoryRouter>);
    await waitFor(() => expect(replaceState).toHaveBeenCalledWith(null, '', '/verificateur'));
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Carte graphique' })).toHaveValue('1'));
    await userEvent.click(screen.getByRole('button', { name: '⚡ Vérifier' }));

    expect(await screen.findByText('Le niveau recommandé n’est pas encore atteint.')).toBeInTheDocument();
    expect(screen.getByText(/Aucun upgrade CPU\/GPU correspondant/)).toBeInTheDocument();
    expect(screen.queryByText(/atteint déjà le niveau recommandé/)).not.toBeInTheDocument();
  });
});
