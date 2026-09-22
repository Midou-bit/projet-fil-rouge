import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyticsConfigured, loadAnalytics, unloadAnalytics } from './analytics';

describe('GoatCounter loader', () => {
  beforeEach(() => {
    unloadAnalytics();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    unloadAnalytics();
    vi.unstubAllEnvs();
  });

  it('reste inactif sans code de site ou avec un code invalide', () => {
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

    loadAnalytics();
    loadAnalytics();

    const scripts = document.querySelectorAll<HTMLScriptElement>('#frameforge-goatcounter');
    expect(analyticsConfigured()).toBe(true);
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toBe('https://gc.zgo.at/count.js');
    expect(scripts[0].dataset.goatcounter).toBe('https://frameforge-demo.goatcounter.com/count');
    expect(scripts[0].async).toBe(true);
  });

  it('retire le chargeur et permet une future réactivation consentie', () => {
    vi.stubEnv('VITE_GOATCOUNTER_CODE', 'frameforge-demo');
    loadAnalytics();

    unloadAnalytics();
    expect(document.querySelector('#frameforge-goatcounter')).toBeNull();

    loadAnalytics();
    expect(document.querySelector('#frameforge-goatcounter')).not.toBeNull();
  });
});
