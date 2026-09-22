let loaded = false;
const SCRIPT_ID = 'frameforge-goatcounter';

/**
 * Charge le script de mesure d'audience GoatCounter configuré par l'exploitant.
 * Le code ne promet ni anonymat, ni lieu d'hébergement : ces propriétés dépendent du compte et
 * du service effectivement configurés et doivent être vérifiées avant une mise en production.
 *
 * Ne fait rien tant que (1) aucun code de site n'est configuré (`VITE_GOATCOUNTER_CODE`) ou
 * (2) l'utilisateur n'a pas donné son consentement via la bannière. Idempotent.
 *
 * Le code de site est la partie qui précède `.goatcounter.com` dans l'adresse du tableau de
 * bord. Il se règle en variable de build (`netlify.toml`, ou l'interface de l'hébergeur).
 */
export function loadAnalytics() {
  if (loaded) return;
  const code = import.meta.env.VITE_GOATCOUNTER_CODE as string | undefined;
  if (!code || !/^[a-z0-9-]+$/i.test(code)) return; // pas d'outil valide configuré (dev/démo)
  loaded = true;
  const s = document.createElement('script');
  s.id = SCRIPT_ID;
  s.async = true;
  s.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
  s.src = 'https://gc.zgo.at/count.js';
  document.head.appendChild(s);
}

/** Empêche tout nouveau chargement après retrait; aucun événement déjà envoyé ne peut être annulé. */
export function unloadAnalytics() {
  document.getElementById(SCRIPT_ID)?.remove();
  loaded = false;
}

export function analyticsConfigured(): boolean {
  const code = import.meta.env.VITE_GOATCOUNTER_CODE as string | undefined;
  return !!code && /^[a-z0-9-]+$/i.test(code);
}
