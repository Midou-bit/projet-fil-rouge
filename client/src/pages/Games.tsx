import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFreeToGameDiscoveries, useGames } from '../api/queries';
import MediaImage from '../components/MediaImage';
import { useSeo } from '../lib/seo';

export default function Games() {
  useSeo('Catalogue de jeux', 'Parcours les jeux et obtiens le build PC qui les fait tourner à la résolution et au FPS voulus.');
  const { data: games = [], isError: gamesFailed, isLoading: loading } = useGames();
  const {
    data: discoveries = [],
    isError: discoveriesFailed,
    isFetching: discoveriesFetching,
    isLoading: discoveriesLoading,
    refetch: retryDiscoveries,
  } = useFreeToGameDiscoveries();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const genres = useMemo(
    () => Array.from(new Set(games.map((g) => g.genre).filter(Boolean))) as string[],
    [games],
  );
  const [genre, setGenre] = useState('');

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return games.filter((g) =>
      (!s || g.title.toLowerCase().includes(s) || (g.genre ?? '').toLowerCase().includes(s)) &&
      (!genre || g.genre === genre));
  }, [games, search, genre]);

  return (
    <div className="container">
      <h1>🎮 Catalogue de jeux</h1>
      <p className="muted" style={{ maxWidth: 620 }}>
        Parcours les jeux, puis lance « Je veux jouer à… » pour obtenir le build qui les fait tourner.
      </p>

      <section aria-labelledby="free-to-play-live-title" style={{ margin: '2rem 0' }}>
        <div className="between row wrap" style={{ alignItems: 'end' }}>
          <div>
            <h2 id="free-to-play-live-title" style={{ marginBottom: '0.35rem' }}>
              Découverte Free-to-Play en direct
            </h2>
            <p className="muted" style={{ margin: 0, maxWidth: 680 }}>
              Une sélection populaire chargée directement par ton navigateur, en complément du catalogue FRAMEFORGE.
            </p>
          </div>
          <a
            href="https://www.freetogame.com/"
            target="_blank"
            rel="noreferrer"
            className="muted"
          >
            Données : FreeToGame ↗
          </a>
        </div>

        {discoveriesLoading ? (
          <div className="surface center" role="status" aria-live="polite" style={{ marginTop: '1rem', padding: '1.5rem' }}>
            <div className="spinner" aria-hidden="true" style={{ margin: '0 auto' }} />
            <p className="muted" style={{ marginBottom: 0 }}>Chargement des découvertes FreeToGame…</p>
          </div>
        ) : discoveriesFailed ? (
          <div className="surface center" style={{ marginTop: '1rem', padding: '1.5rem' }}>
            <p role="alert" style={{ marginTop: 0 }}>
              Les découvertes externes sont temporairement indisponibles. Le catalogue FRAMEFORGE reste accessible ci-dessous.
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => retryDiscoveries()}
              disabled={discoveriesFetching}
            >
              {discoveriesFetching ? 'Nouvel essai…' : 'Réessayer'}
            </button>
          </div>
        ) : discoveries.length === 0 ? (
          <p className="surface muted center" role="status" style={{ marginTop: '1rem', padding: '1.5rem' }}>
            Aucune découverte n’est disponible pour le moment.
          </p>
        ) : (
          <div className="grid free-to-play-grid">
            {discoveries.map((game) => (
              <article key={game.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--bg)' }}>
                  <MediaImage
                    src={game.thumbnail}
                    alt={`Illustration de ${game.title}`}
                    fit="cover"
                    label={game.title}
                  />
                </div>
                <div className="stack" style={{ padding: '0.9rem', flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', margin: 0 }}>{game.title}</h3>
                  {game.shortDescription && (
                    <p className="muted" style={{ fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                      {game.shortDescription}
                    </p>
                  )}
                  <div className="row wrap" style={{ gap: '0.4rem', marginTop: 'auto' }}>
                    {game.genre && <span className="badge badge-cyan">{game.genre}</span>}
                    {game.platform && <span className="badge">{game.platform}</span>}
                    {game.releaseDate && <span className="badge">📅 {game.releaseDate.slice(0, 4)}</span>}
                  </div>
                  {game.profileUrl && (
                    <a href={game.profileUrl} target="_blank" rel="noreferrer">
                      Voir la fiche sur FreeToGame ↗
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="surface row wrap games-filters" style={{ padding: '1rem', gap: '1rem', alignItems: 'end' }}>
        <div style={{ flex: '1 1 240px' }}>
          <label htmlFor="games-search">Recherche</label>
          <input id="games-search" placeholder="Titre ou genre…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ minWidth: 160 }}>
          <label htmlFor="games-genre">Genre</label>
          <select id="games-genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">Tous</option>
            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="center" role="status" aria-live="polite" style={{ padding: '3rem' }}>
          <div className="spinner" aria-hidden="true" style={{ margin: '0 auto' }} />
          <p className="muted" style={{ marginTop: '0.8rem' }}>Catalogue de jeux en cours de chargement…</p>
        </div>
      ) : gamesFailed ? (
        <p className="muted center" role="alert" style={{ padding: '3rem' }}>
          Impossible de charger le catalogue de jeux. Réessaie dans un instant.
        </p>
      ) : games.length === 0 ? (
        <p className="muted center" role="status" style={{ padding: '3rem' }}>
          Aucun jeu n’est disponible pour le moment.
        </p>
      ) : filtered.length === 0 ? (
        <p className="muted center" style={{ padding: '3rem' }}>Aucun jeu ne correspond.</p>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', marginTop: '1.5rem' }}>
          {filtered.map((g, i) => (
            <motion.button
              key={g.id}
              onClick={() => navigate(`/jouer?game=${g.id}`)}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textAlign: 'left', padding: 0, cursor: 'pointer' }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
            >
              <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--bg)' }}>
                <MediaImage src={g.imageUrl} alt={g.title} fit="cover" label={g.title} />
              </div>
              <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <strong style={{ fontFamily: 'var(--font-title)', fontSize: '1.02rem', lineHeight: 1.25 }}>{g.title}</strong>
                <div className="row wrap" style={{ gap: '0.4rem', marginTop: 'auto' }}>
                  <span className="badge">📅 {g.releaseYear}</span>
                  {g.genre && <span className="badge badge-cyan">{g.genre}</span>}
                  {g.metacritic != null && (
                    <span className={`badge ${g.metacritic >= 75 ? 'badge-success' : g.metacritic >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                      MC {g.metacritic}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
