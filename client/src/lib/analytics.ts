let loaded = false;

/**
 * Charge une mesure d'audience **anonyme et sans cookie** (Plausible) — RGPD-friendly.
 * Ne fait rien tant que (1) aucun domaine n'est configuré (`VITE_PLAUSIBLE_DOMAIN`), ou
 * (2) l'utilisateur n'a pas donné son consentement. Idempotent.
 */
export function loadAnalytics() {
  if (loaded) return;
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
  if (!domain) return; // pas d'outil de mesure configuré (dev/démo)
  loaded = true;
  const s = document.createElement('script');
  s.defer = true;
  s.dataset.domain = domain;
  s.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(s);
}
