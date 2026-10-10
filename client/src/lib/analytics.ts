import { readConsent } from './consent';

let loaded = false;
let scriptReady = false;
const SCRIPT_ID = 'frameforge-goatcounter';

type GoatCounterWindow = Window & {
  goatcounter?: { count?: () => void; no_onload?: boolean };
};

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
  if (readConsent()?.choice !== 'accepted') return;
  const code = import.meta.env.VITE_GOATCOUNTER_CODE as string | undefined;
  if (!code || !/^[a-z0-9-]+$/i.test(code)) return; // pas d'outil valide configuré (dev/démo)
  loaded = true;
  const goatCounterWindow = window as GoatCounterWindow;
  goatCounterWindow.goatcounter = { ...goatCounterWindow.goatcounter, no_onload: true };

  // Après un retrait pendant le téléchargement, on réutilise le script neutralisé si
  // l'utilisateur accepte de nouveau avant que la requête réseau ne se termine.
  if (document.getElementById(SCRIPT_ID)) return;

  scriptReady = false;
  const s = document.createElement('script');
  s.id = SCRIPT_ID;
  s.async = true;
  s.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
  // Évite l'envoi automatique différé par count.js : on compte explicitement après
  // chargement, uniquement si le consentement est encore valide à cet instant.
  s.dataset.goatcounterSettings = JSON.stringify({ no_onload: true });
  s.addEventListener('load', () => {
    scriptReady = true;
    if (loaded && readConsent()?.choice === 'accepted') {
      goatCounterWindow.goatcounter?.count?.();
    } else {
      s.remove();
      delete goatCounterWindow.goatcounter;
    }
  }, { once: true });
  s.addEventListener('error', () => {
    scriptReady = true;
    loaded = false;
    s.remove();
    delete goatCounterWindow.goatcounter;
  }, { once: true });
  s.src = 'https://gc.zgo.at/count.js';
  document.head.appendChild(s);
}

/** Empêche tout nouveau chargement après retrait; aucun événement déjà envoyé ne peut être annulé. */
export function unloadAnalytics() {
  loaded = false;
  const script = document.getElementById(SCRIPT_ID);
  const goatCounterWindow = window as GoatCounterWindow;

  if (!script || scriptReady) {
    script?.remove();
    delete goatCounterWindow.goatcounter;
    return;
  }

  // Un script dynamique retiré pendant son téléchargement peut malgré tout s'exécuter.
  // On le garde donc connecté et neutralisé jusqu'à son événement load/error.
  goatCounterWindow.goatcounter = { ...goatCounterWindow.goatcounter, no_onload: true };
}

export function analyticsConfigured(): boolean {
  const code = import.meta.env.VITE_GOATCOUNTER_CODE as string | undefined;
  return !!code && /^[a-z0-9-]+$/i.test(code);
}
