import { useState, type CSSProperties } from 'react';

const CATEGORY_ICON: Record<string, string> = {
  gpu: '🎮',
  cpu: '🧠',
  ram: '🧩',
  stockage: '💾',
  'carte-mere': '🔌',
  alimentation: '⚡',
  boitier: '📦',
};

interface MediaImageProps {
  src?: string | null;
  alt: string;
  /** Icône de repli (sinon dérivée du categorySlug). */
  categorySlug?: string;
  fit?: 'cover' | 'contain';
  /** Texte affiché sous l'icône quand on tombe sur le placeholder. */
  label?: string;
  style?: CSSProperties;
}

/**
 * Image robuste : si `src` est absent OU si le chargement échoue (404, service down…),
 * on bascule sur un placeholder local stylé (icône catégorie + nom) — aucune dépendance
 * externe, donc jamais de carte vide ni d'icône « image cassée ».
 */
export default function MediaImage({ src, alt, categorySlug, fit = 'cover', label, style }: MediaImageProps) {
  const [failed, setFailed] = useState(false);

  // Réinitialise l'état si la source change (ex. navigation entre produits) — ajustement pendant
  // le rendu plutôt qu'un effect (pattern React recommandé, évite un rendu supplémentaire).
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setFailed(false);
  }

  const showPlaceholder = !src || failed;
  const icon = (categorySlug && CATEGORY_ICON[categorySlug]) || '🖥️';

  // position:absolute + inset:0 → l'image (ou la tuile) remplit EXACTEMENT son conteneur et ne peut
  // jamais en faire varier la hauteur selon son ratio → cartes toujours de même taille. Le conteneur
  // parent doit être positionné (position:relative) et dimensionné (aspect-ratio ou height fixe).
  const fill: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' };

  // Visuel généré on-brand (tuile tech cohérente avec le thème Tron) — voir .media-art dans index.css.
  if (showPlaceholder) {
    return (
      <div className="media-art" role="img" aria-label={alt} style={{ ...fill, ...style }}>
        <span className="media-art-icon">{icon}</span>
        {label && <span className="media-art-label">{label}</span>}
      </div>
    );
  }

  return (
    <img
      src={src ?? undefined}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ ...fill, objectFit: fit, ...style }}
    />
  );
}
