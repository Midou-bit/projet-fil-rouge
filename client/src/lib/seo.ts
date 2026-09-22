import { useEffect } from 'react';

const BASE = 'FrameForge';
const DEFAULT_TITLE = `${BASE} — Forge ton build gaming`;
const DEFAULT_DESC = 'Boutique de composants PC + moteur de recommandation gaming. Choisis un jeu, on te dit quoi acheter.';
/** Visuel de repli déclaré dans index.html, servi à la racine du site. */
const DEFAULT_IMAGE = '/og-image.png';
const PRIVATE_ROUTE = /^\/(?:admin(?:\/|$)|panier(?:\/|$)|commandes(?:\/|$)|checkout(?:\/|$)|login(?:\/|$))/;

interface SeoOptions {
  /** Empêche l'indexation (404 et espaces privés), sans prétendre modifier le statut HTTP de la SPA. */
  noIndex?: boolean;
  /** Chemin canonique explicite. Par défaut, la query-string et le fragment sont retirés. */
  canonicalPath?: string;
}

interface HeadSnapshot<T extends Element> {
  element: T;
  existed: boolean;
  previous: string | null;
  attribute: string;
}

function upsertMeta(selector: string, attr: string, name: string, content: string): HeadSnapshot<HTMLMetaElement> {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  const existed = !!el;
  const prev = el?.getAttribute('content') ?? null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return { element: el, existed, previous: prev, attribute: 'content' };
}

function upsertCanonical(href: string): HeadSnapshot<HTMLLinkElement> {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const existed = !!el;
  const previous = el?.getAttribute('href') ?? null;
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
  return { element: el, existed, previous, attribute: 'href' };
}

function restore(snapshot: HeadSnapshot<Element>) {
  if (!snapshot.existed) {
    snapshot.element.remove();
  } else if (snapshot.previous === null) {
    snapshot.element.removeAttribute(snapshot.attribute);
  } else {
    snapshot.element.setAttribute(snapshot.attribute, snapshot.previous);
  }
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
export function useSeo(
  title?: string,
  description?: string,
  jsonLd?: object,
  image?: string | null,
  options?: SeoOptions,
) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : null;
  const noIndex = options?.noIndex;
  const canonicalPath = options?.canonicalPath;
  useEffect(() => {
    const fullTitle = title ? `${title} — ${BASE}` : DEFAULT_TITLE;
    const desc = description ?? DEFAULT_DESC;
    const img = absolute(image || DEFAULT_IMAGE);
    const path = canonicalPath ?? window.location.pathname;
    const url = absolute(path.startsWith('/') ? path : `/${path}`);
    const robots = noIndex ?? PRIVATE_ROUTE.test(window.location.pathname)
      ? 'noindex, nofollow'
      : 'index, follow';

    const prevTitle = document.title;
    document.title = fullTitle;
    const snapshots: HeadSnapshot<Element>[] = [
      upsertMeta('meta[name="description"]', 'name', 'description', desc),
      upsertMeta('meta[name="robots"]', 'name', 'robots', robots),
      upsertMeta('meta[property="og:image"]', 'property', 'og:image', img),
      upsertMeta('meta[property="og:url"]', 'property', 'og:url', url),
      upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle),
      upsertMeta('meta[property="og:description"]', 'property', 'og:description', desc),
      upsertMeta('meta[property="og:type"]', 'property', 'og:type', 'website'),
      upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle),
      upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', desc),
      upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', img),
      upsertCanonical(url),
    ];

    let script: HTMLScriptElement | null = null;
    if (ld) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.frameforgeSeo = 'true';
      script.text = ld;
      document.head.appendChild(script);
    }

    return () => {
      document.title = prevTitle;
      snapshots.forEach(restore);
      script?.remove();
    };
  }, [title, description, ld, image, noIndex, canonicalPath]);
}
