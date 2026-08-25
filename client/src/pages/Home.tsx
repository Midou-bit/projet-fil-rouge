import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProducts } from '../api/queries';
import ProductCard from '../components/ProductCard';
import StatPanel from '../components/StatPanel';
import type { ScoreSummary } from '../api/types';
import { useSeo } from '../lib/seo';

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const modes = [
  { to: '/jouer', icon: '🎯', title: 'Je veux jouer à…', desc: 'Choisis un jeu + une qualité visée → on te sort le build complet, ajoutable en un clic.' },
  { to: '/verificateur', icon: '🔍', title: 'Mon PC fait-il tourner X ?', desc: 'Décris ton CPU + GPU + un jeu → verdict immédiat et upgrade conseillé.' },
  { to: '/builder', icon: '🛠️', title: 'Builder interactif', desc: 'Assemble ton PC, vois les barres de perf s’animer en temps réel + un avant/après.' },
];

// Score d'exemple pour l'aperçu du hero (illustratif — pas d'appel API).
const heroScore: ScoreSummary = {
  estimatedFps: 92,
  gamingPerformance: 84,
  cpuPower: 76,
  visualQuality: 'Ultra',
  bottleneckPenalty: 0,
  priceValue: 4.6,
  meetsMinimum: true,
  meetsRecommended: true,
  verdict: 'Ça tourne (recommandé)',
};

export default function Home() {
  useSeo(
    'Composants PC + moteur de recommandation gaming',
    'Choisis un jeu, on te dit quoi acheter pour le faire tourner — et inversement. Builds recommandés, vérificateur et builder interactif.',
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'FrameForge',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://frameforge.app',
      description: 'Boutique de composants PC augmentée d’un moteur de recommandation gaming (Can I Run It, dans les deux sens).',
    },
  );
  const { data, isLoading } = useProducts({ sort: 'perf', pageSize: 4 });
  const top = data?.items ?? [];

  return (
    <div className="container stack" style={{ gap: '3rem' }}>
      {/* HERO — 2 colonnes : accroche à gauche, aperçu de la feature phare à droite */}
      <section style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, border: '1px solid var(--border)', background: 'radial-gradient(120% 140% at 85% 0%, rgba(34,211,238,0.14), transparent 55%), var(--surface)' }}>
        <div className="grid split" style={{ padding: 'clamp(1.75rem, 5vw, 3.5rem)', alignItems: 'center', gap: '2.5rem' }}>
          {/* Gauche : texte */}
          <div>
            <motion.div initial="hidden" animate="show" variants={fade} custom={0}>
              <span className="badge badge-cyan">⚡ Moteur de recommandation gaming</span>
            </motion.div>
            <motion.h1 initial="hidden" animate="show" variants={fade} custom={1}
              className="glitch" style={{ maxWidth: 620, marginTop: '1rem' }}>
              Choisis un jeu. On te dit quoi acheter pour le faire tourner.
            </motion.h1>
            <motion.p initial="hidden" animate="show" variants={fade} custom={2}
              className="muted" style={{ maxWidth: 520, fontSize: '1.1rem' }}>
              Boutique de composants PC augmentée d’un système « Can I Run It » qui marche dans les deux sens —
              du jeu vers le matos, et du matos vers le jeu.
            </motion.p>
            <motion.div initial="hidden" animate="show" variants={fade} custom={3} className="row wrap" style={{ marginTop: '1.5rem' }}>
              <Link to="/jouer" className="btn btn-action">🎯 Trouver mon build</Link>
              <Link to="/boutique" className="btn btn-cyan">Explorer la boutique</Link>
            </motion.div>
          </div>

          {/* Droite : aperçu « build recommandé » (réutilise StatPanel — barres animées à l'entrée) */}
          <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}>
            <div className="surface" style={{ padding: '1.3rem', borderColor: 'rgba(34,211,238,0.4)', boxShadow: 'var(--glow-cyan)' }}>
              <div className="row between" style={{ marginBottom: '0.9rem', alignItems: 'flex-start' }}>
                <div>
                  <div className="muted" style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Aperçu · Je veux jouer à
                  </div>
                  <strong style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem' }}>Cyberpunk 2077</strong>
                </div>
                <span className="badge badge-cyan">1080p · 60 fps</span>
              </div>
              <StatPanel score={heroScore} />
              <div className="row between" style={{ marginTop: '0.4rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border)' }}>
                <span className="badge badge-success">✅ {heroScore.verdict}</span>
                <span className="price" style={{ fontSize: '1.25rem' }}>1 820 €</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3 modes différenciants */}
      <section>
        <h2>Trois façons de forger ton setup</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {modes.map((m, i) => (
            <motion.div key={m.to} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} custom={i}>
              <Link to={m.to} className="card feature-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '1.5rem', height: '100%' }}>
                <div className="row between" style={{ alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '2rem' }}>{m.icon}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>0{i + 1}</span>
                </div>
                <h3 style={{ margin: 0 }}>{m.title}</h3>
                <p className="muted" style={{ fontSize: '0.92rem', margin: 0, flex: 1 }}>{m.desc}</p>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.3rem' }}>
                  Découvrir <span className="feature-arrow">→</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Top perf */}
      <section>
        <div className="row between" style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Top performances</h2>
          <Link to="/boutique" className="btn btn-sm btn-ghost">Tout voir →</Link>
        </div>
        {isLoading ? (
          <div className="center" style={{ padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {top.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
