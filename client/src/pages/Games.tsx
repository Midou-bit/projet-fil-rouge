import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGames } from '../api/queries';
import MediaImage from '../components/MediaImage';
import { useSeo } from '../lib/seo';

export default function Games() {
  useSeo('Catalogue de jeux', 'Parcours les jeux et obtiens le build PC qui les fait tourner à la résolution et au FPS voulus.');
  const { data: games = [], isLoading: loading } = useGames();
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

      <div className="surface row wrap" style={{ padding: '1rem', gap: '1rem', alignItems: 'end' }}>
        <div style={{ flex: '1 1 240px' }}>
          <label>Recherche</label>
          <input placeholder="Titre ou genre…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ minWidth: 160 }}>
          <label>Genre</label>
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">Tous</option>
            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {loading || games.length === 0 ? (
        <div className="center" style={{ padding: '3rem' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
          {games.length === 0 && <p className="muted" style={{ marginTop: '0.8rem' }}>Catalogue de jeux en cours de chargement…</p>}
        </div>
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
