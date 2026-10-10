import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyticsConfigured, loadAnalytics, unloadAnalytics } from './analytics';
import { saveConsent } from './consent';

type GoatCounterWindow = Window & {
  goatcounter?: { count?: () => void; no_onload?: boolean };
};

function resetAnalytics() {
  unloadAnalytics();
  document.querySelector<HTMLScriptElement>('#frameforge-goatcounter')?.dispatchEvent(new Event('error'));
  document.querySelector('#frameforge-goatcounter')?.remove();
  delete (window as GoatCounterWindow).goatcounter;
}

describe('GoatCounter loader', () => {
  beforeEach(() => {
    resetAnalytics();
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  afterEach(() => {
    resetAnalytics();
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  it('reste inactif sans code de site ou avec un code invalide', () => {
    saveConsent('accepted');
    vi.stubEnv('VITE_GOATCOUNTER_CODE', '');
    expect(analyticsConfigured()).toBe(false);
    loadAnalytics();
    expect(document.querySelector('#frameforge-goatcounter')).toBeNull();

    vi.stubEnv('VITE_GOATCOUNTER_CODE', 'bad.example/path');
    expect(analyticsConfigured()).toBe(false);
    loadAnalytics();
    expect(document.querySelector('#frameforge-goatcounter')).toBeNull();
  });

  it('charge une seule fois le script attendu avec un code public valide', () => {
    vi.stubEnv('VITE_GOATCOUNTER_CODE', 'frameforge-demo');
    saveConsent('accepted');

    loadAnalytics();
    loadAnalytics();

    const scripts = document.querySelectorAll<HTMLScriptElement>('#frameforge-goatcounter');
    expect(analyticsConfigured()).toBe(true);
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toBe('https://gc.zgo.at/count.js');
    expect(scripts[0].dataset.goatcounter).toBe('https://frameforge-demo.goatcounter.com/count');
    expect(scripts[0].dataset.goatcounterSettings).toBe('{"no_onload":true}');
    expect(scripts[0].async).toBe(true);
  });

  it('ne charge rien sans consentement ou après un refus', () => {
    vi.stubEnv('VITE_GOATCOUNTER_CODE', 'frameforge-demo');

    loadAnalytics();
    expect(document.querySelector('#frameforge-goatcounter')).toBeNull();

    saveConsent('refused');
    loadAnalytics();
    expect(document.querySelector('#frameforge-goatcounter')).toBeNull();
  });

  it('compte après chargement seulement si le consentement est toujours accepté', () => {
    vi.stubEnv('VITE_GOATCOUNTER_CODE', 'frameforge-demo');
    saveConsent('accepted');
    loadAnalytics();
    const script = document.querySelector<HTMLScriptElement>('#frameforge-goatcounter')!;
    const count = vi.fn();
    (window as GoatCounterWindow).goatcounter = { count };

    script.dispatchEvent(new Event('load'));
    script.dispatchEvent(new Event('load'));

    expect(count).toHaveBeenCalledTimes(1);
  });

  it('annule un envoi différé si le consentement est retiré pendant le chargement', () => {
    vi.stubEnv('VITE_GOATCOUNTER_CODE', 'frameforge-demo');
    saveConsent('accepted');
    loadAnalytics();
    const script = document.querySelector<HTMLScriptElement>('#frameforge-goatcounter')!;
    const count = vi.fn();
    (window as GoatCounterWindow).goatcounter = { count };

    saveConsent('refused');
    unloadAnalytics();

    // La balise reste connectée pour que count.js lise encore no_onload s'il finit
    // de se télécharger ; elle sera nettoyée dès que load/error arrivera.
    expect(document.querySelector('#frameforge-goatcounter')).toBe(script);
    expect((window as GoatCounterWindow).goatcounter?.no_onload).toBe(true);
    script.dispatchEvent(new Event('load'));

    expect(count).not.toHaveBeenCalled();
    expect(document.querySelector('#frameforge-goatcounter')).toBeNull();
  });

  it('retire le chargeur et permet une future réactivation consentie', () => {
    vi.stubEnv('VITE_GOATCOUNTER_CODE', 'frameforge-demo');
    saveConsent('accepted');
    loadAnalytics();
    const script = document.querySelector<HTMLScriptElement>('#frameforge-goatcounter')!;
    (window as GoatCounterWindow).goatcounter = { count: vi.fn() };
    script.dispatchEvent(new Event('load'));

    unloadAnalytics();
    expect(document.querySelector('#frameforge-goatcounter')).toBeNull();

    loadAnalytics();
    expect(document.querySelector('#frameforge-goatcounter')).not.toBeNull();
  });
});
