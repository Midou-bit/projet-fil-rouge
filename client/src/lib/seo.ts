import { useEffect } from 'react';

const BASE = 'FrameForge';
const DEFAULT_TITLE = `${BASE} — Forge ton build gaming`;
const DEFAULT_DESC = 'Boutique de composants PC + moteur de recommandation gaming. Choisis un jeu, on te dit quoi acheter.';
/** Visuel de repli déclaré dans index.html, servi à la racine du site. */
const DEFAULT_IMAGE = '/og-image.png';

function upsertMeta(selector: string, attr: string, name: string, content: string): string | null {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  const prev = el?.getAttribute('content') ?? null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return prev;
}

/** Les robots de partage ne résolvent pas les chemins relatifs : tout doit être absolu. */
function absolute(url: string): string {
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return url;
  }
}

/**
 * SEO par page : met à jour <title>, meta description, Open Graph (dont l'image et l'URL
 * canonique de partage), et injecte éventuellement un bloc JSON-LD (données structurées).
 * Restaure l'état au démontage. (C20)
 *
 * @param image visuel de partage propre à la page (une fiche produit partage sa photo).
 *              Absent, on retombe sur l'image générique du site.
 */
export function useSeo(title?: string, description?: string, jsonLd?: object, image?: string | null) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : null;
  useEffect(() => {
    const fullTitle = title ? `${title} — ${BASE}` : DEFAULT_TITLE;
    const desc = description ?? DEFAULT_DESC;
    const img = absolute(image || DEFAULT_IMAGE);
    const url = window.location.href;

    const prevTitle = document.title;
    document.title = fullTitle;
    const prevDesc = upsertMeta('meta[name="description"]', 'name', 'description', desc);
    const prevImage = upsertMeta('meta[property="og:image"]', 'property', 'og:image', img);
    const prevUrl = upsertMeta('meta[property="og:url"]', 'property', 'og:url', url);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', desc);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', desc);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', img);

    let script: HTMLScriptElement | null = null;
    if (ld) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = ld;
      document.head.appendChild(script);
    }

    return () => {
      document.title = prevTitle;
      if (prevDesc !== null) upsertMeta('meta[name="description"]', 'name', 'description', prevDesc);
      if (prevImage !== null) upsertMeta('meta[property="og:image"]', 'property', 'og:image', prevImage);
      if (prevUrl !== null) upsertMeta('meta[property="og:url"]', 'property', 'og:url', prevUrl);
      script?.remove();
    };
  }, [title, description, ld, image]);
}
