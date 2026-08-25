import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { engineApi } from '../api/endpoints';
import { useGames, useProducts } from '../api/queries';
import type { Product, ScoreSummary } from '../api/types';
import { euro } from '../lib/format';
import { checkCompatibility, buildCoherent, coherentFrom } from '../lib/compatibility';
import StatPanel from '../components/StatPanel';
import BuilderSlot from '../components/BuilderSlot';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSeo } from '../lib/seo';
import { useToast } from '../components/Toast';
import { errorMessage } from '../api/client';

const SLOTS: { slug: string; label: string; icon: string }[] = [
  { slug: 'gpu', label: 'Carte graphique', icon: '🎮' },
  { slug: 'cpu', label: 'Processeur', icon: '🧠' },
  { slug: 'ram', label: 'Mémoire', icon: '🧩' },
  { slug: 'stockage', label: 'Stockage', icon: '💾' },
  { slug: 'carte-mere', label: 'Carte mère', icon: '🔌' },
  { slug: 'alimentation', label: 'Alimentation', icon: '⚡' },
  { slug: 'boitier', label: 'Boîtier', icon: '📦' },
];
const RESOS = ['1080p', '1440p', '4K'];
const FPSES = [60, 144];

interface SavedBuild { name: string; parts: number[]; gameId: number | null; reso: string; fps: number; }
const BUILDS_KEY = 'frameforge.builds';
const loadSaved = (): SavedBuild[] => {
  try { return JSON.parse(localStorage.getItem(BUILDS_KEY) || '[]') as SavedBuild[]; } catch { return []; }
};

export default function Builder() {
  useSeo('Builder interactif', 'Assemble ton PC pièce par pièce : compatibilité vérifiée en direct, barres de performance animées et prix mis à jour en temps réel.');
  const { data: page } = useProducts({ pageSize: 100, sort: 'price_asc' });
  const { data: games = [] } = useGames();
  const [params, setParams] = useSearchParams();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { notify } = useToast();

  const byCat = useMemo(() => {
    const g: Record<string, Product[]> = {};
    for (const p of page?.items ?? []) (g[p.categorySlug] ??= []).push(p);
    return g;
  }, [page]);
  const allProducts = useMemo(() => Object.values(byCat).flat(), [byCat]);

  const [selected, setSelected] = useState<Record<string, number>>({});
  const [gameId, setGameId] = useState<number | null>(null);
  const [reso, setReso] = useState('1080p');
  const [fps, setFps] = useState(60);
  const [score, setScore] = useState<ScoreSummary | null>(null);
  const [scoreError, setScoreError] = useState(false);
  const [baseline, setBaseline] = useState<ScoreSummary | null>(null);
  const [saved, setSaved] = useState<SavedBuild[]>(loadSaved);
  const initDone = useRef(false);

  // Init une fois les produits chargés : depuis l'URL (?parts=…) si build partagé, sinon un build
  // par défaut COHÉRENT (socket/RAM/alim accordés) → le Builder ne s'ouvre jamais incompatible.
  useEffect(() => {
    if (initDone.current || allProducts.length === 0) return;
    initDone.current = true;
    // Init one-shot (guardée par `initDone`) : ces setState ne bouclent pas.
    /* eslint-disable react-hooks/set-state-in-effect */
    const fromUrl = (params.get('parts') ?? '').split(',').map(Number).filter(Boolean);
    if (fromUrl.length) {
      const init: Record<string, number> = {};
      for (const s of SLOTS) {
        const opts = byCat[s.slug] ?? [];
        const match = opts.find((o) => fromUrl.includes(o.id)) ?? opts[0];
        if (match) init[s.slug] = match.id;
      }
      setSelected(init);
    } else {
      setSelected(buildCoherent(byCat, 'budget'));
    }
    if (params.get('game')) setGameId(Number(params.get('game')));
    if (params.get('res')) setReso(params.get('res')!);
    if (params.get('fps')) setFps(Number(params.get('fps')));
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProducts]);

  // Jeu cible par défaut (premier jeu) si non fourni par l'URL.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (gameId == null && games.length && !params.get('game')) setGameId(games[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games]);

  const selectedProducts = useMemo(
    () => Object.values(selected).map((id) => allProducts.find((p) => p.id === id)).filter(Boolean) as Product[],
    [selected, allProducts],
  );
  const total = selectedProducts.reduce((s, p) => s + p.price, 0);
  const compat = useMemo(() => checkCompatibility(selectedProducts, byCat), [selectedProducts, byCat]);
  const hasIncompat = compat.some((c) => !c.ok);

  // Recalcule les stats (modèle de score) à chaque changement.
  useEffect(() => {
    const ids = Object.values(selected);
    if (ids.length === 0) return;
    engineApi.calc({ productIds: ids, gameId, resolution: reso, targetFps: fps })
      .then((s) => { setScore(s); setScoreError(false); })
      .catch(() => setScoreError(true));
  }, [selected, gameId, reso, fps]);

  // Presets = builds COHÉRENTS (socket/RAM/alim accordés), plus « le meilleur par slot » isolé.
  function applyPreset(kind: 'budget' | 'balanced' | 'perf') {
    setSelected(buildCoherent(byCat, kind));
  }

  // Ré-aligne les pièces support (carte mère/RAM/alim) en gardant le CPU et le GPU choisis.
  function fixCompatibility() {
    setSelected((cur) => coherentFrom(cur, byCat));
    notify('Build rendu compatible (carte mère, mémoire et alim ajustées).', 'success');
  }

  function share() {
    const parts = Object.values(selected).join(',');
    const q = new URLSearchParams({ parts, res: reso, fps: String(fps) });
    if (gameId) q.set('game', String(gameId));
    setParams(q, { replace: true });
    const url = `${window.location.origin}/builder?${q.toString()}`;
    navigator.clipboard?.writeText(url)
      .then(() => notify('Lien du build copié dans le presse-papier !', 'success'))
      .catch(() => notify('Lien prêt dans la barre d’adresse.', 'info'));
  }

  function saveBuild() {
    const name = window.prompt('Nom du build :')?.trim();
    if (!name) return;
    const build: SavedBuild = { name, parts: Object.values(selected), gameId, reso, fps };
    const next = [...saved.filter((b) => b.name !== name), build];
    localStorage.setItem(BUILDS_KEY, JSON.stringify(next));
    setSaved(next);
    notify(`Build « ${name} » sauvegardé.`, 'success');
  }

  function applySaved(b: SavedBuild) {
    const init: Record<string, number> = {};
    for (const s of SLOTS) {
      const m = (byCat[s.slug] ?? []).find((o) => b.parts.includes(o.id));
      if (m) init[s.slug] = m.id;
    }
    setSelected(init);
    setGameId(b.gameId);
    setReso(b.reso);
    setFps(b.fps);
    notify(`Build « ${b.name} » chargé.`, 'info');
  }

  function deleteSaved(name: string) {
    const next = saved.filter((b) => b.name !== name);
    localStorage.setItem(BUILDS_KEY, JSON.stringify(next));
    setSaved(next);
  }

  async function addAll() {
    if (!isAuthenticated) return notify('Connecte-toi pour ajouter au panier.', 'info');
    if (hasIncompat) notify('Attention : ton build a des incompatibilités (voir la section Compatibilité).', 'info');
    try {
      for (const p of selectedProducts) await addItem(p.id, 1);
      notify('Build ajouté au panier !', 'success');
    } catch (e) { notify(errorMessage(e), 'error'); }
  }

  const fpsDelta = score && baseline ? score.estimatedFps - baseline.estimatedFps : 0;
  const perfDelta = score && baseline ? score.gamingPerformance - baseline.gamingPerformance : 0;

  return (
    <div className="container">
      <div className="row between wrap">
        <div>
          <h1 style={{ marginBottom: 0 }}>🛠️ Builder</h1>
          <p className="muted" style={{ marginTop: '0.3rem' }}>Assemble, compare avant/après, partage ton build.</p>
        </div>
        <div className="row wrap" style={{ gap: '0.5rem' }}>
          <span className="price" style={{ fontSize: '1.4rem' }}>{euro(total)}</span>
          <button className="btn btn-sm" onClick={share}>🔗 Partager</button>
          <button className="btn btn-sm" onClick={saveBuild}>💾 Sauvegarder</button>
          <button className="btn btn-action" onClick={addAll}>🛒 Ajouter</button>
        </div>
      </div>

      {/* Presets + builds sauvegardés */}
      <div className="row between wrap" style={{ gap: '0.6rem', marginTop: '0.8rem' }}>
        <div className="row wrap" style={{ gap: '0.4rem' }}>
          <span className="muted" style={{ fontSize: '0.82rem', alignSelf: 'center' }}>Preset :</span>
          <button className="btn btn-sm btn-ghost" onClick={() => applyPreset('budget')}>💰 Budget</button>
          <button className="btn btn-sm btn-ghost" onClick={() => applyPreset('balanced')}>⚖️ Équilibré</button>
          <button className="btn btn-sm btn-ghost" onClick={() => applyPreset('perf')}>🚀 Perf max</button>
        </div>
        {saved.length > 0 && (
          <details>
            <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
              Mes builds ({saved.length})
            </summary>
            <div className="surface" style={{ padding: '0.6rem', marginTop: '0.4rem', display: 'grid', gap: '0.3rem', minWidth: 220 }}>
              {saved.map((b) => (
                <div key={b.name} className="row between" style={{ gap: '0.5rem' }}>
                  <button className="btn btn-sm btn-ghost" style={{ flex: 1, justifyContent: 'flex-start' }} onClick={() => applySaved(b)}>{b.name}</button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteSaved(b.name)}>✕</button>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Composants à gauche, stats à droite — un seul écran, empilé sur mobile (.split) */}
      <div className="grid split" style={{ alignItems: 'start', marginTop: '1rem' }}>
        <div className="stack">
          {SLOTS.map((slot) => (
            <BuilderSlot
              key={slot.slug}
              icon={slot.icon}
              label={slot.label}
              options={byCat[slot.slug] ?? []}
              value={selected[slot.slug]}
              onChange={(id) => setSelected((s) => ({ ...s, [slot.slug]: id }))}
            />
          ))}
        </div>

        <motion.div className="surface" style={{ padding: '1.3rem', position: 'sticky', top: 80 }}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="row wrap" style={{ gap: '0.6rem', marginBottom: '1rem', alignItems: 'end' }}>
            <div style={{ flex: '1 1 140px' }}>
              <label>Jeu cible</label>
              {games.length === 0 ? (
                <p className="muted" style={{ margin: '0.4rem 0 0', fontSize: '0.85rem' }}>Chargement…</p>
              ) : (
                <select value={gameId ?? ''} onChange={(e) => setGameId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">— Aucun —</option>
                  {games.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
              )}
            </div>
          </div>
          <div className="row wrap" style={{ gap: '0.6rem', marginBottom: '1rem' }}>
            <div className="row" style={{ gap: '0.3rem' }}>
              {RESOS.map((r) => <button key={r} className={`btn btn-sm ${reso === r ? 'btn-cyan' : 'btn-ghost'}`} onClick={() => setReso(r)}>{r}</button>)}
            </div>
            <div className="row" style={{ gap: '0.3rem' }}>
              {FPSES.map((f) => <button key={f} className={`btn btn-sm ${fps === f ? 'btn-cyan' : 'btn-ghost'}`} onClick={() => setFps(f)}>{f}</button>)}
            </div>
          </div>

          {scoreError && (
            <p className="badge badge-danger" style={{ marginBottom: '0.6rem' }}>
              Calcul des performances indisponible — réessaie dans un instant.
            </p>
          )}
          {score && <StatPanel score={score} fpsScale={Math.max(144, fps)} />}

          {/* Compatibilité du build — explication claire + substitut en 1 clic pour les débutants */}
          {compat.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.8rem', paddingTop: '0.8rem' }}>
              <div className="row between" style={{ marginBottom: '0.5rem' }}>
                <span className="statbar-label">🔧 Compatibilité</span>
                {hasIncompat && (
                  <button className="btn btn-sm btn-cyan" onClick={fixCompatibility}>Rendre compatible</button>
                )}
              </div>
              <div className="stack" style={{ gap: '0.6rem' }}>
                {compat.map((c) => (
                  <div key={c.label}>
                    <div className="row" style={{ gap: '0.5rem', fontSize: '0.82rem', alignItems: 'flex-start' }}>
                      <span aria-hidden>{c.ok ? '✅' : '⚠️'}</span>
                      <span style={{ color: c.ok ? 'var(--text-muted)' : 'var(--danger)' }}>
                        <strong style={{ color: 'var(--text)' }}>{c.label}</strong> — {c.detail}
                      </span>
                    </div>
                    {!c.ok && c.explain && (
                      <p className="muted" style={{ margin: '0.3rem 0 0 1.4rem', fontSize: '0.8rem', lineHeight: 1.4 }}>{c.explain}</p>
                    )}
                    {!c.ok && c.fix && (
                      <button className="btn btn-sm btn-action" style={{ margin: '0.4rem 0 0 1.4rem' }}
                        onClick={() => setSelected((s) => ({ ...s, [c.fix!.slug]: c.fix!.product.id }))}>
                        🔧 {c.fix.label} — {euro(c.fix.product.price)}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avant / après */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.8rem', paddingTop: '0.8rem' }}>
            <div className="row between">
              <button className="btn btn-sm" onClick={() => setBaseline(score)} disabled={!score}>📸 Figer comme référence</button>
              {baseline && <button className="btn btn-sm btn-ghost" onClick={() => setBaseline(null)}>Réinitialiser</button>}
            </div>
            {baseline && score && (
              <div className="row between" style={{ marginTop: '0.7rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                <span className="muted">vs référence :</span>
                <span>
                  <span style={{ color: fpsDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fpsDelta >= 0 ? '▲' : '▼'} {Math.abs(fpsDelta)} fps</span>
                  {'  '}
                  <span style={{ color: perfDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}>{perfDelta >= 0 ? '▲' : '▼'} {Math.abs(perfDelta)} perf</span>
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
