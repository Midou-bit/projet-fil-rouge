import { render, screen, within } from '@testing-library/react';
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

const discoveries: FreeToGameDiscovery[] = [
  ['World of Tanks: HEAT', 'Jeu de combat de véhicules en free-to-play proposant des affrontements rapides en équipe.'],
  ['Where Winds Meet', 'Jeu d’action-aventure en monde ouvert inspiré de la Chine ancienne.'],
  ['Neverness to Everness', 'RPG en monde ouvert mêlant exploration urbaine, action et éléments surnaturels.'],
  ['Battlefield REDSEC', 'Jeu de tir multijoueur proposant des affrontements à grande échelle.'],
  ['PUBG: BATTLEGROUNDS', 'Battle royale multijoueur où les joueurs s’affrontent jusqu’au dernier survivant.'],
].map(([title, shortDescription], index) => ({
  id: index + 1,
  title,
  thumbnail: `https://www.freetogame.com/g/${index + 1}/thumbnail.jpg`,
  shortDescription,
  genre: 'Action',
  platform: 'PC (Windows)',
  releaseDate: '2026-01-02',
  profileUrl: `https://www.freetogame.com/game-${index + 1}.html`,
}));

const refetch = vi.fn();

function renderPage() {
  return render(<MemoryRouter><Games /></MemoryRouter>);
}

function setDiscoveryState(overrides: Record<string, unknown> = {}) {
  queryMocks.useFreeToGameDiscoveries.mockReturnValue({
    data: discoveries,
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

  it('renders exactly five direct discoveries separately with the required attribution', () => {
    renderPage();

    const heading = screen.getByRole('heading', { name: 'Découverte Free-to-Play en direct' });
    const discoverySection = heading.closest('section');

    expect(discoverySection).not.toBeNull();
    const section = within(discoverySection as HTMLElement);
    expect(section.getAllByRole('article')).toHaveLength(5);
    expect(section.queryByRole('heading', { name: 'Roblox' })).not.toBeInTheDocument();
    for (const discovery of discoveries) {
      expect(section.getByRole('heading', { name: discovery.title })).toBeInTheDocument();
      expect(section.getByText(discovery.shortDescription)).toBeInTheDocument();
    }
    expect(section.getByRole('link', { name: /Données : FreeToGame/ })).toHaveAttribute(
      'href',
      'https://www.freetogame.com/',
    );
    expect(screen.getByRole('textbox', { name: 'Recherche' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Genre' })).toBeInTheDocument();
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
