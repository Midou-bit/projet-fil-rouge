import { useEffect, useRef, useState } from 'react';
import { analyticsConfigured, loadAnalytics, unloadAnalytics } from '../lib/analytics';
import { readConsent, saveConsent, subscribeConsent, type ConsentChoice } from '../lib/consent';

const LABELS: Record<ConsentChoice, string> = {
  accepted: 'statistiques acceptées',
  refused: 'statistiques refusées',
};

export default function PrivacyPreferences() {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<ConsentChoice | null>(() => readConsent()?.choice ?? null);
  const trigger = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => subscribeConsent((record) => setChoice(record.choice)), []);
  useEffect(() => {
    if (open) heading.current?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    globalThis.setTimeout(() => trigger.current?.focus(), 0);
  }

  function decide(value: ConsentChoice) {
    saveConsent(value);
    setChoice(value);
    if (value === 'accepted') loadAnalytics();
    else unloadAnalytics();
  }

  return (
    <>
      <button ref={trigger} type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(true)}>
        Préférences de confidentialité
      </button>
      {open && (
        <div className="privacy-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) close();
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="privacy-title" className="surface privacy-dialog"
            onKeyDown={(event) => { if (event.key === 'Escape') close(); }}>
            <h2 id="privacy-title" ref={heading} tabIndex={-1}>Préférences de confidentialité</h2>
            <p role="status">
              Choix actuel : <strong>{choice ? LABELS[choice] : 'aucun choix enregistré'}</strong>.
            </p>
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              Le stockage nécessaire à la session et aux préférences reste actif. GoatCounter ne peut être chargé
              qu’après ton accord{analyticsConfigured() ? '.' : ', mais aucun code de site n’est configuré actuellement.'}
            </p>
            <div className="row wrap" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => decide('refused')}>
                Refuser / retirer mon accord
              </button>
              <button type="button" className="btn btn-sm btn-action" onClick={() => decide('accepted')}>
                Accepter la mesure d'audience
              </button>
              <button type="button" className="btn btn-sm" onClick={close}>Fermer</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
