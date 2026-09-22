import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameBuild, useGames } from '../api/queries';
import { euro } from '../lib/format';
import StatPanel from '../components/StatPanel';
import ProductCard from '../components/ProductCard';
import MediaImage from '../components/MediaImage';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { errorMessage } from '../api/client';
import { useSeo } from '../lib/seo';

const RESOS = ['1080p', '1440p', '4K'];
const FPSES = [60, 144];

export default function PlayWhat() {
  useSeo('Je veux jouer à…', 'Choisis un jeu et la qualité visée : on te compose un build PC complet, équilibré et chiffré, ajoutable au panier en un clic.');
  const { data: games = [] } = useGames();
  const [gameId, setGameId] = useState<number | null>(null);
  const [reso, setReso] = useState('1080p');
  const [fps, setFps] = useState(60);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { notify } = useToast();
  const [params] = useSearchParams();

  // Présélection via ?game=<id> (depuis le catalogue), sinon le premier jeu, dès que la liste arrive.
  useEffect(() => {
    if (gameId != null || games.length === 0) return;
    const requested = Number(params.get('game'));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGameId(games.find((x) => x.id === requested)?.id ?? games[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games]);

  const { data: build, isLoading: loading, isError } = useGameBuild(gameId, reso, fps);
  const selectedGame = games.find((g) => g.id === gameId);

  async function addAll() {
    if (!isAuthenticated) return notify('Connecte-toi pour ajouter le build au panier.', 'info');
    if (!build) return;
    try {
      for (const p of build.parts) await addItem(p.id, 1);
      notify('Build complet ajouté au panier !', 'success');
    } catch (e) { notify(errorMessage(e), 'error'); }
  }

  return (
    <div className="container">
      <h1>🎯 Je veux jouer à…</h1>
      <p className="muted" style={{ maxWidth: 620 }}>
        Choisis un jeu et la qualité visée. On te compose un build complet, équilibré et chiffré.
      </p>

      <div className="surface row wrap" style={{ padding: '1rem', gap: '1rem', alignItems: 'end' }}>
        <div style={{ flex: '1 1 220px' }}>
          <label htmlFor="play-game">Jeu</label>
          {games.length === 0 ? (
            <p className="muted" style={{ margin: '0.4rem 0 0', fontSize: '0.85rem' }}>Catalogue de jeux en cours de chargement…</p>
          ) : (
            <select id="play-game" value={gameId ?? ''} onChange={(e) => setGameId(Number(e.target.value))}>
              {games.map((g) => <option key={g.id} value={g.id}>{g.title} ({g.releaseYear})</option>)}
            </select>
          )}
        </div>
        <div>
          <span className="control-label" id="play-resolution-label">Résolution</span>
          <div className="row" role="group" aria-labelledby="play-resolution-label" style={{ gap: '0.4rem' }}>
            {RESOS.map((r) => (
              <button type="button" key={r} aria-pressed={reso === r}
                className={`btn btn-sm ${reso === r ? 'btn-cyan' : 'btn-ghost'}`} onClick={() => setReso(r)}>{r}</button>
            ))}
          </div>
        </div>
        <div>
          <span className="control-label" id="play-fps-label">FPS visés</span>
          <div className="row" role="group" aria-labelledby="play-fps-label" style={{ gap: '0.4rem' }}>
            {FPSES.map((f) => (
              <button type="button" key={f} aria-pressed={fps === f}
                className={`btn btn-sm ${fps === f ? 'btn-cyan' : 'btn-ghost'}`} onClick={() => setFps(f)}>{f} fps</button>
            ))}
          </div>
        </div>
      </div>

      {selectedGame && (
        <div className="surface row wrap" style={{ padding: '1rem', marginTop: '1rem', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 200, aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', background: 'var(--bg)', flexShrink: 0 }}>
            <MediaImage src={selectedGame.imageUrl} alt={selectedGame.title} fit="cover" label={selectedGame.title} />
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{selectedGame.title}</h2>
            <div className="row wrap" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
              <span className="badge">📅 {selectedGame.releaseYear}</span>
              {selectedGame.genre && <span className="badge badge-cyan">{selectedGame.genre}</span>}
              {selectedGame.metacritic != null && (
                <span className={`badge ${selectedGame.metacritic >= 75 ? 'badge-success' : selectedGame.metacritic >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                  Metacritic {selectedGame.metacritic}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="center" role="status" aria-live="polite" style={{ padding: '3rem' }}>
          <div className="spinner" aria-hidden="true" style={{ margin: '0 auto' }} />
          <span className="sr-only">Calcul du build recommandé…</span>
        </div>
      ) : isError ? (
        <div className="surface center" style={{ padding: '2rem', marginTop: '1.5rem' }}>
          <p className="muted">Impossible de calculer le build recommandé pour ce jeu. Réessaie ou change de jeu.</p>
        </div>
      ) : build && (
        <div className="grid split" style={{ marginTop: '1.5rem', alignItems: 'start' }}>
          <div>
            <div className="row between wrap" style={{ marginBottom: '0.8rem' }}>
              <h2 style={{ margin: 0 }}>Build recommandé</h2>
              <div className="row" style={{ gap: '0.6rem' }}>
                <span className="price" style={{ fontSize: '1.3rem' }}>{euro(build.totalPrice)}</span>
                <button className="btn btn-action" onClick={addAll}>🛒 Tout ajouter</button>
              </div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {build.parts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>

          <motion.div className="surface" style={{ padding: '1.3rem', position: 'sticky', top: 80 }}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="row between" style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Performances</h3>
              <span className={`badge ${build.score.meetsRecommended ? 'badge-success' : build.score.meetsMinimum ? 'badge-warning' : 'badge-danger'}`}>
                {build.score.verdict}
              </span>
            </div>
            <StatPanel score={build.score} fpsScale={Math.max(144, fps)} />
            <Link
              to={`/builder?parts=${build.parts.map((p) => p.id).join(',')}${gameId ? `&game=${gameId}` : ''}&res=${reso}&fps=${fps}`}
              className="btn btn-cyan btn-block btn-sm" style={{ marginTop: '0.8rem' }}>
              Ajuster dans le builder →
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  );
}
