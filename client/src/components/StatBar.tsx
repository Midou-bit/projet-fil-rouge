import { motion, useReducedMotion } from 'framer-motion';

interface StatBarProps {
  label: string;
  /** Valeur affichée (ex. "78" ou "144 fps" ou "Ultra"). */
  display: string;
  /** Remplissage 0-100. */
  percent: number;
  tone?: 'cyan' | 'danger' | 'warning';
  icon?: string;
}

/** Barre de stat animée façon Call of Duty : la largeur s'anime à chaque changement. */
export default function StatBar({ label, display, percent, tone = 'cyan', icon }: StatBarProps) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, percent));
  const toneClass = tone === 'danger' ? 'is-danger' : tone === 'warning' ? 'is-warning' : '';
  return (
    <div className="statbar">
      <div className="statbar-head">
        <span className="statbar-label">{icon ? `${icon} ` : ''}{label}</span>
        <span className="statbar-value">{display}</span>
      </div>
      <div className="statbar-track">
        <motion.div
          className={`statbar-fill ${toneClass}`}
          initial={{ width: reduceMotion ? `${clamped}%` : 0 }}
          animate={{ width: `${clamped}%` }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
}
