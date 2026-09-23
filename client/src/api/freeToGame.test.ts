import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchFreeToGameDiscoveries } from './freeToGame';

const validGame = {
  id: 42,
  title: 'Test Arena',
  thumbnail: 'https://www.freetogame.com/g/42/thumbnail.jpg',
  short_description: 'This English API description must never be shown.',
  genre: 'Shooter',
  platform: 'PC (Windows)',
  publisher: 'Studio',
  developer: 'Studio',
  release_date: '2026-01-02',
  freetogame_profile_url: 'https://www.freetogame.com/test-arena.html',
};

function responseWith(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe('FreeToGame API client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('calls FreeToGame directly and maps a validated JSON response', async () => {
    vi.mocked(fetch).mockResolvedValue(responseWith([validGame]));

    await expect(fetchFreeToGameDiscoveries()).resolves.toEqual([{
      id: 42,
      title: 'Test Arena',
      thumbnail: 'https://www.freetogame.com/g/42/thumbnail.jpg',
      shortDescription: 'Jeu gratuit de type Shooter disponible sur PC.',
      genre: 'Shooter',
      platform: 'PC (Windows)',
      releaseDate: '2026-01-02',
      profileUrl: 'https://www.freetogame.com/test-arena.html',
    }]);

    expect(fetch).toHaveBeenCalledWith(
      'https://www.freetogame.com/api/games?platform=pc&sort-by=popularity',
      expect.objectContaining({
        method: 'GET',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('keeps five games, excludes Roblox and uses the local French descriptions', async () => {
    const expectedSelection = [
      {
        title: 'World of Tanks: HEAT',
        shortDescription: 'Jeu de combat de véhicules en free-to-play proposant des affrontements rapides en équipe.',
      },
      {
        title: 'Where Winds Meet',
        shortDescription: 'Jeu d’action-aventure en monde ouvert inspiré de la Chine ancienne.',
      },
      {
        title: 'Neverness to Everness',
        shortDescription: 'RPG en monde ouvert mêlant exploration urbaine, action et éléments surnaturels.',
      },
      {
        title: 'Battlefield REDSEC',
        shortDescription: 'Jeu de tir multijoueur proposant des affrontements à grande échelle.',
      },
      {
        title: 'PUBG: BATTLEGROUNDS',
        shortDescription: 'Battle royale multijoueur où les joueurs s’affrontent jusqu’au dernier survivant.',
      },
    ];
    const apiPayload = [
      { ...validGame, id: 1, title: 'Roblox' },
      ...expectedSelection.map(({ title }, index) => ({
        ...validGame,
        id: index + 2,
        title,
      })),
      { ...validGame, id: 7, title: 'Unexpected sixth game' },
    ];
    vi.mocked(fetch).mockResolvedValue(responseWith(apiPayload));

    const games = await fetchFreeToGameDiscoveries();

    expect(games).toHaveLength(5);
    expect(games).not.toEqual(expect.arrayContaining([expect.objectContaining({ title: 'Roblox' })]));
    expect(games.map(({ title, shortDescription }) => ({ title, shortDescription })))
      .toEqual(expectedSelection);
  });

  it('ignores malformed games and external URLs instead of trusting the payload', async () => {
    vi.mocked(fetch).mockResolvedValue(responseWith([
      { id: 'invalid', title: '' },
      {
        ...validGame,
        thumbnail: 'https://tracker.example/thumbnail.jpg',
        freetogame_profile_url: 'javascript:alert(1)',
      },
    ]));

    const games = await fetchFreeToGameDiscoveries();

    expect(games).toHaveLength(1);
    expect(games[0]).toMatchObject({ id: 42, title: 'Test Arena' });
    expect(games[0].thumbnail).toBeUndefined();
    expect(games[0].profileUrl).toBeUndefined();
  });

  it('rejects HTTP failures and malformed top-level JSON', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(responseWith({}, 503));
    await expect(fetchFreeToGameDiscoveries()).rejects.toThrow('statut 503');

    vi.mocked(fetch).mockResolvedValueOnce(responseWith({ games: [] }));
    await expect(fetchFreeToGameDiscoveries()).rejects.toThrow('Réponse FreeToGame invalide');
  });

  it('aborts a request that exceeds the eight-second timeout', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'));
      });
    }));

    const request = fetchFreeToGameDiscoveries();
    const assertion = expect(request).rejects.toThrow('met trop de temps');

    await vi.advanceTimersByTimeAsync(8_000);
    await assertion;
  });
});
