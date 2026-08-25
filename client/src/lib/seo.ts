import { useEffect } from 'react';

const BASE = 'FrameForge';
const DEFAULT_TITLE = `${BASE} — Forge ton build gaming`;
const DEFAULT_DESC = 'Boutique de composants PC + moteur de recommandation gaming. Choisis un jeu, on te dit quoi acheter.';

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

/**
 * SEO par page : met à jour <title>, meta description + Open Graph, et injecte éventuellement
 * un bloc JSON-LD (données structurées). Restaure l'état au démontage. (C20)
 */
export function useSeo(title?: string, description?: string, jsonLd?: object) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : null;
  useEffect(() => {
    const fullTitle = title ? `${title} — ${BASE}` : DEFAULT_TITLE;
    const desc = description ?? DEFAULT_DESC;
    const prevTitle = document.title;
    document.title = fullTitle;
    const prevDesc = upsertMeta('meta[name="description"]', 'name', 'description', desc);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', desc);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', 'website');

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
      script?.remove();
    };
  }, [title, description, ld]);
}
