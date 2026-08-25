let loaded = false;

/**
 * Charge une mesure d'audience **anonyme et sans cookie** (GoatCounter) — RGPD-friendly :
 * aucun cookie, aucun identifiant persistant, pas de profilage, données hébergées en Europe.
 *
 * Ne fait rien tant que (1) aucun code de site n'est configuré (`VITE_GOATCOUNTER_CODE`), ou
 * (2) l'utilisateur n'a pas donné son consentement via la bannière. Idempotent.
 *
 * Le code de site est la partie qui précède `.goatcounter.com` dans l'adresse du tableau de
 * bord. Il se règle en variable de build (`netlify.toml`, ou l'interface de l'hébergeur).
 */
export function loadAnalytics() {
  if (loaded) return;
  const code = import.meta.env.VITE_GOATCOUNTER_CODE as string | undefined;
  if (!code) return; // pas d'outil de mesure configuré (dev/démo)
  loaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
  s.src = 'https://gc.zgo.at/count.js';
  document.head.appendChild(s);
}
