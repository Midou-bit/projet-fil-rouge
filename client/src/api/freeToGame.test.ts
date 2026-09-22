import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchFreeToGameDiscoveries } from './freeToGame';

const validGame = {
  id: 42,
  title: 'Test Arena',
  thumbnail: 'https://www.freetogame.com/g/42/thumbnail.jpg',
  short_description: 'Un jeu de test free-to-play.',
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
      shortDescription: 'Un jeu de test free-to-play.',
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
