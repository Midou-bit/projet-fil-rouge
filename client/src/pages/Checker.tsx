import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { engineApi } from '../api/endpoints';
import { useGames, useProducts } from '../api/queries';
import type { CheckResult, Game, GameRequirement, Product } from '../api/types';
import { euro } from '../lib/format';
import StatPanel from '../components/StatPanel';
import PerfBadge from '../components/PerfBadge';
import { useToast } from '../components/Toast';
import { errorMessage } from '../api/client';
import { useSeo } from '../lib/seo';
import { decodePcCode, matchGpuToCatalog, matchCpuToCatalog, matchCpuByCores, nearestRam } from '../lib/detectHardware';
import { gpuScoreFor, cpuScoreFor } from '../lib/hardwareScores';
import { evaluate } from '../lib/scoring';

const RESOS = ['1080p', '1440p', '4K'];
const FPSES = [60, 144];

/** Matériel détecté résolu en scores de puissance (échelle catalogue) prêt à évaluer. */
interface DetectedPc { gpuScore: number; cpuScore: number; ram: number; label: string }

/** Prérequis d'un jeu pour une résolution/FPS (repli sur le plus léger si l'exact manque). */
function requirementFor(game: Game, resolution: string, targetFps: number): GameRequirement | undefined {
  return game.requirements.find((r) => r.resolution === resolution && r.targetFps === targetFps)
    ?? [...game.requirements].sort((a, b) => a.recoGpuScore - b.recoGpuScore)[0];
}

/** Composant catalogue le moins cher atteignant au moins `minScore` (pour les upgrades conseillés). */
function cheapestAtLeast(list: Product[], minScore: number): Product | null {
  return list
    .filter((product) => product.stock > 0 && product.perfScore >= minScore)
    .sort((a, b) => a.price - b.price)[0] ?? null;
}

function UpgradeCard({ label, product }: { label: string; product: Product }) {
  return (
    <Link to={`/produit/${product.id}`} className="surface" style={{ padding: '0.8rem', display: 'block' }}>
      <div className="row between">
        <span className="muted" style={{ fontSize: '0.78rem' }}>{label}</span>
        <PerfBadge score={product.perfScore} />
      </div>
      <strong style={{ display: 'block', margin: '0.3rem 0' }}>{product.name}</strong>
      <div className="row between">
        <span className="price">{euro(product.price)}</span>
        <span className="btn btn-action btn-sm">Voir →</span>
      </div>
    </Link>
  );
}

export default function Checker() {
  useSeo('Mon PC fait-il tourner ce jeu ?', 'Analyse ton vrai PC avec notre outil ou choisis ton matériel, et sais en un instant si un jeu tourne — avec l\'upgrade conseillé.');
  const { data: gpuPage } = useProducts({ category: 'gpu', pageSize: 50, sort: 'perf' });
  const { data: cpuPage } = useProducts({ category: 'cpu', pageSize: 50, sort: 'perf' });
  const { data: games = [] } = useGames();
  const gpus = useMemo(() => gpuPage?.items ?? [], [gpuPage?.items]);
  const cpus = useMemo(() => cpuPage?.items ?? [], [cpuPage?.items]);
  const [gpuId, setGpuId] = useState<number | null>(null);
  const [cpuId, setCpuId] = useState<number | null>(null);
  const [gameId, setGameId] = useState<number | null>(null);
  const [reso, setReso] = useState('1080p');
  const [fps, setFps] = useState(60);
  const [ram, setRam] = useState(16);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);
  const [detectedPc, setDetectedPc] = useState<DetectedPc | null>(null);
  const [code, setCode] = useState('');
  const { notify } = useToast();
  const location = useLocation();
  const autoRan = useRef(false);

  // Valeurs par défaut dès que les listes arrivent (GPU/CPU les plus modestes → démontre l'upgrade).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (gpuId == null && gpus.length) setGpuId(gpus.at(-1)!.id); }, [gpus, gpuId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (cpuId == null && cpus.length) setCpuId(cpus.at(-1)!.id); }, [cpus, cpuId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (gameId == null && games.length) setGameId(games[0].id); }, [games, gameId]);

  // L'outil ouvre le site avec le matériel dans le fragment (#pc=…, jamais envoyé au serveur).
  // Dès que le catalogue et le jeu par défaut sont prêts, on analyse tout seul → verdict automatique.
  useEffect(() => {
    if (autoRan.current) return;
    const pc = new URLSearchParams(location.hash.slice(1)).get('pc');
    if (pc && gpus.length && cpus.length && gameId != null) {
      autoRan.current = true;
      // Le fragment peut révéler une configuration matérielle s'il reste dans un lien copié ou
      // l'historique visible : le retirer dès sa prise en compte, sans ajouter d'entrée d'historique.
      window.history.replaceState(window.history.state, '', `${location.pathname}${location.search}`);
      analyzeCode(pc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash, location.pathname, location.search, gpus, cpus, gameId]);

  // Verdict pour du matériel DÉTECTÉ (catalogue ou non) — calculé côté client, live selon jeu/réso/fps.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!detectedPc || gameId == null) return;
    const game = games.find((g) => g.id === gameId);
    const req = game ? requirementFor(game, reso, fps) : undefined;
    if (!game || !req) return;
    const score = evaluate(detectedPc.gpuScore, detectedPc.cpuScore, detectedPc.ram, req);
    setResult({
      gameTitle: game.title,
      resolution: req.resolution,
      targetFps: req.targetFps,
      score,
      suggestedGpuUpgrade: detectedPc.gpuScore < req.recoGpuScore ? cheapestAtLeast(gpus, req.recoGpuScore) : null,
      suggestedCpuUpgrade: detectedPc.cpuScore < req.recoCpuScore ? cheapestAtLeast(cpus, req.recoCpuScore) : null,
    });
    setDetected(detectedPc.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedPc, reso, fps, gameId, games]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function runWith(g: number, c: number, r: number) {
    if (!gameId) return;
    setBusy(true);
    try {
      setResult(await engineApi.check({ gpuId: g, cpuId: c, gameId, resolution: reso, targetFps: fps, ramGb: r }));
    } catch (e) { notify(errorMessage(e), 'error'); }
    finally { setBusy(false); }
  }

  // Bouton « Vérifier » : on simule avec le matériel SÉLECTIONNÉ (boutique) → on quitte le mode détecté.
  async function run() {
    if (!gpuId || !cpuId || !gameId) return;
    setDetectedPc(null);
    setDetected(null);
    await runWith(gpuId, cpuId, ram);
  }

  // Analyse le code de l'outil local → vrai GPU/CPU/RAM → estime la puissance (même hors catalogue) → verdict.
  // `raw` permet l'auto-analyse depuis l'URL (#pc=…) ; sinon on lit le champ collé.
  function analyzeCode(raw?: string) {
    const value = (raw ?? code).trim();
    const specs = decodePcCode(value);
    if (!specs) {
      notify("Code invalide. Relance l'outil et colle le code entier (il commence par « FF1- »).", 'error');
      return;
    }
    setCode(value);
    const detectedRam = nearestRam(specs.ram);
    setRam(detectedRam);

    // Puissance : équivalent catalogue si trouvé, sinon table de référence (matériel intégré/portable/ancien).
    const gpuMatch = matchGpuToCatalog(specs.gpu, gpus);
    const cpuMatch = matchCpuToCatalog(specs.cpu, cpus) ?? matchCpuByCores(specs.cores, cpus);
    if (gpuMatch) setGpuId(gpuMatch.id);
    if (cpuMatch) setCpuId(cpuMatch.id);

    const gpuScore = gpuMatch?.perfScore ?? gpuScoreFor(specs.gpu);
    if (gpuScore == null) {
      setDetectedPc(null);
      setResult(null);
      setDetected(`${specs.gpu} · ${specs.cpu} · ${specs.cores} cœurs · ${detectedRam} Go — carte graphique non reconnue, choisis un équivalent ci-dessous`);
      notify("Carte graphique peu courante : impossible d'estimer sa puissance. Choisis un équivalent dans la liste ci-dessous.", 'info');
      return;
    }
    const cpuScore = cpuMatch?.perfScore ?? cpuScoreFor(specs.cpu) ?? 50;

    const gpuTag = gpuMatch ? '' : ` (~${gpuScore}/100)`;
    const cpuTag = cpuMatch ? '' : ` (~${cpuScore}/100)`;
    const label = `${specs.gpu}${gpuTag} · ${specs.cpu} (${specs.cores} cœurs${cpuTag}) · ${detectedRam} Go`;
    // Le verdict est calculé par l'effet ci-dessus (et se met à jour si on change jeu/réso/fps).
    setDetectedPc({ gpuScore, cpuScore, ram: detectedRam, label });
  }

  const verdictTone = result
    ? result.score.meetsRecommended ? 'success' : result.score.meetsMinimum ? 'warning' : 'danger'
    : 'cyan';

  return (
    <div className="container">
      <h1>🔍 Mon PC fait-il tourner… ?</h1>
      <p className="muted" style={{ maxWidth: 620 }}>
        Analyse ton vrai PC avec notre petit outil (ou choisis ton matériel) et sais en un instant si un jeu tourne — avec l’upgrade conseillé si besoin.
      </p>

      {/* Analyse du VRAI PC — outil local automatique (façon « Can You Run It ») */}
      <div className="surface" style={{ padding: '1.3rem', marginBottom: '1rem' }}>
        <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.15rem' }}>🖥️ Analyser mon vrai PC — automatique</h2>
        <p className="muted" style={{ margin: '0 0 1rem', fontSize: '0.9rem', maxWidth: 660 }}>
          Comme « Can You Run It » : télécharge le petit outil, <strong>double-clique</strong> dessus, et c’est tout —
          il lit ta <strong>vraie</strong> carte graphique / processeur / RAM et <strong>rouvre FrameForge tout seul</strong> avec le verdict.
        </p>

        <div className="row wrap" style={{ gap: '1.2rem', alignItems: 'flex-start' }}>
          <ol className="stack" style={{ gap: '0.7rem', margin: 0, paddingLeft: '1.2rem', fontSize: '0.92rem', flex: '1 1 300px' }}>
            <li>
              <a href="/detect-pc.bat" download className="btn btn-action btn-sm">⬇️ Télécharger l’outil (Windows)</a>
            </li>
            <li>
              <strong>Double-clique</strong> le fichier téléchargé.<br />
              <span className="muted" style={{ fontSize: '0.82rem' }}>
                Windows peut afficher un avertissement (normal pour un programme local) : clique
                « Informations complémentaires » → « Exécuter quand même ».
              </span>
            </li>
            <li>
              <strong>C’est fini !</strong> Le site se rouvre automatiquement avec ton PC analysé et le verdict.
            </li>
          </ol>
        </div>

        {detected && (
          <p style={{ margin: '1rem 0 0', fontSize: '0.9rem', padding: '0.6rem 0.8rem', borderRadius: 8, background: 'var(--bg)' }}>
            🖥️ Détecté : <strong style={{ color: 'var(--accent-cyan)' }}>{detected}</strong>
          </p>
        )}

        <details style={{ marginTop: '1rem' }}>
          <summary className="muted" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
            Ça ne s’ouvre pas tout seul ? Coller le code manuellement
          </summary>
          <div className="row wrap" style={{ gap: '0.5rem', marginTop: '0.7rem', alignItems: 'stretch' }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') analyzeCode(); }}
              placeholder="FF1-…"
              aria-label="Code de détection du PC"
              style={{ flex: '1 1 260px', fontFamily: 'var(--font-mono)' }}
            />
            <button className="btn btn-cyan" disabled={busy || !code.trim()} onClick={() => analyzeCode()}>
              ⚡ Analyser
            </button>
          </div>
          <p className="muted" style={{ margin: '0.6rem 0 0', fontSize: '0.8rem' }}>
            Version lisible (PowerShell) : <a href="/detect-pc.ps1" download>detect-pc.ps1</a>.
            L’outil affiche aussi un code <code>FF1-…</code> (copié dans ton presse-papier) à coller ici.
          </p>
        </details>

        <p className="muted" style={{ margin: '0.9rem 0 0', fontSize: '0.78rem' }}>
          100 % local et volontaire : l’outil n’envoie rien à un serveur — les infos voyagent dans l’adresse du site
          (fragment <code>#</code>, jamais transmis). <Link to="/confidentialite">Confidentialité</Link>.
          Sur Mac/Linux, choisis ton matériel manuellement ci-dessous.
        </p>
      </div>

      <div className="surface" style={{ padding: '1.2rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', alignItems: 'end' }}>
        <div>
          <label htmlFor="checker-gpu">Carte graphique</label>
          <select id="checker-gpu" value={gpuId ?? ''} onChange={(e) => setGpuId(Number(e.target.value))}>
            {gpus.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.perfScore})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="checker-cpu">Processeur</label>
          <select id="checker-cpu" value={cpuId ?? ''} onChange={(e) => setCpuId(Number(e.target.value))}>
            {cpus.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.perfScore})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="checker-ram">RAM (Go)</label>
          <select id="checker-ram" value={ram} onChange={(e) => setRam(Number(e.target.value))}>
            {[8, 16, 32, 64].map((r) => <option key={r} value={r}>{r} Go</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="checker-game">Jeu</label>
          {games.length === 0 ? (
            <p className="muted" style={{ margin: '0.4rem 0 0', fontSize: '0.85rem' }}>Chargement…</p>
          ) : (
            <select id="checker-game" value={gameId ?? ''} onChange={(e) => setGameId(Number(e.target.value))}>
              {games.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          )}
        </div>
        <div>
          <span className="control-label" id="checker-resolution-label">Résolution</span>
          <div className="row" role="group" aria-labelledby="checker-resolution-label" style={{ gap: '0.3rem' }}>
            {RESOS.map((r) => <button type="button" key={r} aria-pressed={reso === r}
              className={`btn btn-sm ${reso === r ? 'btn-cyan' : 'btn-ghost'}`} onClick={() => setReso(r)}>{r}</button>)}
          </div>
        </div>
        <div>
          <span className="control-label" id="checker-fps-label">FPS visés</span>
          <div className="row" role="group" aria-labelledby="checker-fps-label" style={{ gap: '0.3rem' }}>
            {FPSES.map((f) => <button type="button" key={f} aria-pressed={fps === f}
              className={`btn btn-sm ${fps === f ? 'btn-cyan' : 'btn-ghost'}`} onClick={() => setFps(f)}>{f}</button>)}
          </div>
        </div>
        <button className="btn btn-action" style={{ gridColumn: '1 / -1' }} disabled={busy} onClick={run}>
          {busy ? '…' : '⚡ Vérifier'}
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="grid split" style={{ marginTop: '1.5rem', alignItems: 'start' }}>
          <div className="surface" style={{ padding: '1.3rem', borderColor: `var(--${verdictTone === 'cyan' ? 'border' : verdictTone})` }}>
            <div className="center" style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '2.4rem' }}>{result.score.meetsMinimum ? '✅' : '❌'}</div>
              <h2 style={{ margin: '0.3rem 0' }} className={`${verdictTone === 'danger' ? '' : ''}`}>{result.score.verdict}</h2>
              <p className="muted" style={{ margin: 0 }}>{result.gameTitle} — {result.resolution} / {result.targetFps} fps</p>
            </div>
            <StatPanel score={result.score} fpsScale={Math.max(144, fps)} />
          </div>

          <div className="stack">
            {(result.suggestedGpuUpgrade || result.suggestedCpuUpgrade) ? (
              <>
                <h3 style={{ margin: 0 }}>🔧 Upgrades conseillés</h3>
                <p className="muted" style={{ fontSize: '0.88rem', marginTop: 0 }}>
                  Pour atteindre le niveau recommandé sur ce jeu :
                </p>
                {result.suggestedGpuUpgrade && <UpgradeCard label="Carte graphique" product={result.suggestedGpuUpgrade} />}
                {result.suggestedCpuUpgrade && <UpgradeCard label="Processeur" product={result.suggestedCpuUpgrade} />}
              </>
            ) : result.score.meetsRecommended ? (
              <div className="surface center" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '2rem' }}>🎉</div>
                <p className="muted">Ton matériel atteint déjà le niveau recommandé. Aucun upgrade nécessaire !</p>
              </div>
            ) : (
              <div className="surface center" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '2rem' }}>⚠️</div>
                <p style={{ marginBottom: '0.4rem' }}><strong>Le niveau recommandé n’est pas encore atteint.</strong></p>
                <p className="muted" style={{ margin: 0 }}>
                  Aucun upgrade CPU/GPU correspondant n’est disponible dans le catalogue. Vérifie aussi la RAM sélectionnée et les prérequis du jeu.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
