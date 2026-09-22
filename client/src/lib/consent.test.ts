import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONSENT_EVENT,
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  readConsent,
  saveConsent,
  subscribeConsent,
} from './consent';

describe('consent storage', () => {
  beforeEach(() => localStorage.clear());

  it('lit l’ancien format sans perdre le choix existant', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    expect(readConsent()).toEqual({ choice: 'accepted', version: 0, updatedAt: '' });
  });

  it('ignore les valeurs absentes, corrompues ou inconnues', () => {
    expect(readConsent()).toBeNull();
    localStorage.setItem(CONSENT_STORAGE_KEY, '{invalid');
    expect(readConsent()).toBeNull();
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ choice: 'maybe' }));
    expect(readConsent()).toBeNull();
  });

  it('enregistre un choix versionné et horodaté puis notifie les composants', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-21T12:00:00.000Z'));
    const listener = vi.fn();
    const unsubscribe = subscribeConsent(listener);

    const record = saveConsent('refused');

    expect(record).toEqual({
      choice: 'refused', version: CONSENT_VERSION, updatedAt: '2026-09-21T12:00:00.000Z',
    });
    expect(readConsent()).toEqual(record);
    expect(listener).toHaveBeenCalledWith(record);

    unsubscribe();
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: record }));
    expect(listener).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
