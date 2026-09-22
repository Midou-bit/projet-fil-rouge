const FREE_TO_GAME_ENDPOINT =
  'https://www.freetogame.com/api/games?platform=pc&sort-by=popularity';

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_GAMES = 6;
const FREE_TO_GAME_HOST = 'www.freetogame.com';

export interface FreeToGameDiscovery {
  id: number;
  title: string;
  thumbnail?: string;
  shortDescription: string;
  genre: string;
  platform: string;
  releaseDate?: string;
  profileUrl?: string;
}

function readText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function readFreeToGameUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === FREE_TO_GAME_HOST
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function parseGame(value: unknown): FreeToGameDiscovery | null {
  if (!value || typeof value !== 'object') return null;

  const game = value as Record<string, unknown>;
  const id = typeof game.id === 'number' && Number.isInteger(game.id) && game.id > 0
    ? game.id
    : null;
  const title = readText(game.title, 120);

  if (id === null || !title) return null;

  return {
    id,
    title,
    thumbnail: readFreeToGameUrl(game.thumbnail),
    shortDescription: readText(game.short_description, 280),
    genre: readText(game.genre, 60),
    platform: readText(game.platform, 80),
    releaseDate: readText(game.release_date, 10) || undefined,
    profileUrl: readFreeToGameUrl(game.freetogame_profile_url),
  };
}

function parseGames(payload: unknown): FreeToGameDiscovery[] {
  if (!Array.isArray(payload)) {
    throw new Error('Réponse FreeToGame invalide.');
  }

  return payload
    .map(parseGame)
    .filter((game): game is FreeToGameDiscovery => game !== null)
    .slice(0, MAX_GAMES);
}

/**
 * Appel HTTPS direct du navigateur vers l'API publique FreeToGame.
 * Aucun jeton, cookie applicatif ni donnée personnelle n'est transmis.
 */
export async function fetchFreeToGameDiscoveries(
  parentSignal?: AbortSignal,
): Promise<FreeToGameDiscovery[]> {
  const controller = new AbortController();
  const abortFromParent = () => controller.abort(parentSignal?.reason);

  if (parentSignal?.aborted) abortFromParent();
  else parentSignal?.addEventListener('abort', abortFromParent, { once: true });

  const timeoutId = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(FREE_TO_GAME_ENDPOINT, {
      method: 'GET',
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });

    if (!response.ok) {
      throw new Error(`FreeToGame a répondu avec le statut ${response.status}.`);
    }

    return parseGames(await response.json());
  } catch (error) {
    if (controller.signal.aborted && !parentSignal?.aborted) {
      throw new Error('FreeToGame met trop de temps à répondre.', { cause: error });
    }
    if (error instanceof Error) throw error;
    throw new Error('Impossible de contacter FreeToGame.', { cause: error });
  } finally {
    globalThis.clearTimeout(timeoutId);
    parentSignal?.removeEventListener('abort', abortFromParent);
  }
}

export const freeToGameApi = {
  listPopular: fetchFreeToGameDiscoveries,
};
