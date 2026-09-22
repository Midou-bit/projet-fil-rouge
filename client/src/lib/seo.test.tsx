import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useSeo } from './seo';

const selectors = [
  'meta[name="description"]',
  'meta[name="robots"]',
  'meta[property^="og:"]',
  'meta[name^="twitter:"]',
  'link[rel="canonical"]',
  'script[data-frameforge-seo="true"]',
].join(',');

afterEach(() => {
  document.head.querySelectorAll(selectors).forEach((node) => node.remove());
  document.title = '';
  window.history.replaceState({}, '', '/');
});

describe('useSeo', () => {
  it('publishes a query-free canonical URL, social metadata and structured data', () => {
    window.history.replaceState({}, '', '/boutique?sort=perf#products');
    const { unmount } = renderHook(() => useSeo(
      'Boutique',
      'Le catalogue test.',
      { '@context': 'https://schema.org', '@type': 'CollectionPage' },
      '/share.png',
    ));

    expect(document.title).toBe('Boutique — FrameForge');
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'http://localhost:3000/boutique');
    expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute('content', 'http://localhost:3000/boutique');
    expect(document.querySelector('meta[property="og:image"]')).toHaveAttribute('content', 'http://localhost:3000/share.png');
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    expect(document.querySelector('script[data-frameforge-seo="true"]')?.textContent).toContain('CollectionPage');

    unmount();
    expect(document.querySelector('link[rel="canonical"]')).not.toBeInTheDocument();
    expect(document.querySelector('script[data-frameforge-seo="true"]')).not.toBeInTheDocument();
  });

  it('marks private routes and explicit error pages as non-indexable', () => {
    window.history.replaceState({}, '', '/commandes');
    const { rerender } = renderHook(
      ({ noIndex }) => useSeo('Compte', 'Privé', undefined, undefined, { noIndex }),
      { initialProps: { noIndex: undefined as boolean | undefined } },
    );
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');

    window.history.replaceState({}, '', '/url-inconnue');
    rerender({ noIndex: true });
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });

  it('restores head elements that existed before the page mounted', () => {
    const description = document.createElement('meta');
    description.name = 'description';
    description.content = 'Description initiale';
    document.head.appendChild(description);
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = 'https://example.test/original';
    document.head.appendChild(canonical);

    const { unmount } = renderHook(() => useSeo('Temporaire', 'Description temporaire'));
    expect(description).toHaveAttribute('content', 'Description temporaire');
    unmount();

    expect(description).toHaveAttribute('content', 'Description initiale');
    expect(canonical).toHaveAttribute('href', 'https://example.test/original');
  });
});
