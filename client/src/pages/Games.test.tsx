import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FreeToGameDiscovery } from '../api/freeToGame';
import type { Game } from '../api/types';

const queryMocks = vi.hoisted(() => ({
  useGames: vi.fn(),
  useFreeToGameDiscoveries: vi.fn(),
}));

vi.mock('../api/queries', () => queryMocks);

import Games from './Games';

const frameforgeGame: Game = {
  id: 1,
  title: 'FRAMEFORGE Game',
  imageUrl: undefined,
  releaseYear: 2026,
  genre: 'Action',
  metacritic: null,
  requirements: [],
};

const discovery: FreeToGameDiscovery = {
  id: 42,
  title: 'Free Arena',
  thumbnail: 'https://www.freetogame.com/g/42/thumbnail.jpg',
  shortDescription: 'Une découverte chargée en direct.',
  genre: 'Shooter',
  platform: 'PC (Windows)',
  releaseDate: '2026-01-02',
  profileUrl: 'https://www.freetogame.com/free-arena.html',
};

const refetch = vi.fn();

function renderPage() {
  return render(<MemoryRouter><Games /></MemoryRouter>);
}

function setDiscoveryState(overrides: Record<string, unknown> = {}) {
  queryMocks.useFreeToGameDiscoveries.mockReturnValue({
    data: [discovery],
    error: null,
    isError: false,
    isFetching: false,
    isLoading: false,
    refetch,
    ...overrides,
  });
}

describe('Games — FreeToGame discoveries', () => {
  beforeEach(() => {
    refetch.mockReset();
    queryMocks.useGames.mockReturnValue({ data: [frameforgeGame], isError: false, isLoading: false });
    setDiscoveryState();
  });

  it('renders the direct external data separately with the required attribution', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Découverte Free-to-Play en direct' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Free Arena' })).toBeInTheDocument();
    expect(screen.getByText('Une découverte chargée en direct.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Données : FreeToGame/ })).toHaveAttribute(
      'href',
      'https://www.freetogame.com/',
    );
    expect(screen.getAllByText('FRAMEFORGE Game')).not.toHaveLength(0);
  });

  it('announces the loading state', () => {
    setDiscoveryState({ data: undefined, isLoading: true });
    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Chargement des découvertes FreeToGame');
  });

  it('keeps the FRAMEFORGE catalogue available on failure and retries on demand', async () => {
    setDiscoveryState({ data: undefined, error: new Error('network'), isError: true });
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('temporairement indisponibles');
    expect(screen.getAllByText('FRAMEFORGE Game')).not.toHaveLength(0);

    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders an explicit empty state', () => {
    setDiscoveryState({ data: [] });
    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Aucune découverte n’est disponible');
  });

  it('annonce le chargement du catalogue FRAMEFORGE', () => {
    queryMocks.useGames.mockReturnValue({ data: undefined, isError: false, isLoading: true });
    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Catalogue de jeux en cours de chargement');
  });

  it('distingue une erreur du catalogue d’un chargement en cours', () => {
    queryMocks.useGames.mockReturnValue({ data: undefined, isError: true, isLoading: false });
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Impossible de charger le catalogue de jeux');
    expect(screen.queryByText('Catalogue de jeux en cours de chargement…')).not.toBeInTheDocument();
  });

  it('affiche un état vide explicite pour le catalogue FRAMEFORGE', () => {
    queryMocks.useGames.mockReturnValue({ data: [], isError: false, isLoading: false });
    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Aucun jeu n’est disponible pour le moment');
  });
});
