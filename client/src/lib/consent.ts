export const CONSENT_STORAGE_KEY = 'frameforge.cookieConsent';
export const CONSENT_VERSION = 1;
export const CONSENT_EVENT = 'frameforge:consent-change';

export type ConsentChoice = 'accepted' | 'refused';

export interface ConsentRecord {
  choice: ConsentChoice;
  version: number;
  updatedAt: string;
}

function isChoice(value: unknown): value is ConsentChoice {
  return value === 'accepted' || value === 'refused';
}

/** Lit le choix courant et accepte encore l'ancien format texte pour ne pas redemander sans raison. */
export function readConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    if (isChoice(raw)) return { choice: raw, version: 0, updatedAt: '' };

    const parsed = JSON.parse(raw) as Partial<ConsentRecord>;
    if (!isChoice(parsed.choice)) return null;
    return {
      choice: parsed.choice,
      version: typeof parsed.version === 'number' ? parsed.version : 0,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return null;
  }
}

export function saveConsent(choice: ConsentChoice): ConsentRecord {
  const record: ConsentRecord = {
    choice,
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };
  try { localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record)); } catch { /* stockage indisponible */ }
  window.dispatchEvent(new CustomEvent<ConsentRecord>(CONSENT_EVENT, { detail: record }));
  return record;
}

export function subscribeConsent(listener: (record: ConsentRecord) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<ConsentRecord>).detail);
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}
