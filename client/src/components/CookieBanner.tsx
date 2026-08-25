import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadAnalytics } from '../lib/analytics';

const KEY = 'frameforge.cookieConsent';

/** Retourne le consentement enregistré ('accepted' | 'refused' | null). */
function getCookieConsent(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

/**
 * Bannière de consentement RGPD. FrameForge n'utilise que du stockage ESSENTIEL par défaut
 * (session JWT + panier) ; les statistiques anonymes ne sont activées qu'avec le consentement.
 * S'affiche tant qu'aucun choix n'a été fait.
 */
export default function CookieBanner() {
  const [choice, setChoice] = useState<string | null>(() => getCookieConsent());

  // Si l'utilisateur avait déjà accepté lors d'une visite précédente, on (ré)active la mesure d'audience.
  useEffect(() => {
    if (getCookieConsent() === 'accepted') loadAnalytics();
  }, []);

  function decide(value: 'accepted' | 'refused') {
    try { localStorage.setItem(KEY, value); } catch { /* stockage indisponible */ }
    if (value === 'accepted') loadAnalytics();
    setChoice(value);
  }

  if (choice) return null;

  return (
    <div role="dialog" aria-label="Consentement aux cookies" style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 300,
      background: 'var(--surface)', borderTop: '1px solid var(--border)',
      padding: '1rem', boxShadow: '0 -8px 24px rgba(0,0,0,0.35)',
    }}>
      <div className="container row wrap between" style={{ gap: '1rem' }}>
        <p className="muted" style={{ margin: 0, flex: '1 1 320px', fontSize: '0.9rem' }}>
          🍪 On utilise du stockage <strong>essentiel</strong> (ta session et ton panier) et, avec ton accord,
          des <strong>statistiques anonymes</strong> pour améliorer le site. Voir notre{' '}
          <Link to="/confidentialite">politique de confidentialité</Link>.
        </p>
        <div className="row" style={{ gap: '0.5rem' }}>
          <button className="btn btn-sm btn-ghost" onClick={() => decide('refused')}>Refuser</button>
          <button className="btn btn-sm btn-action" onClick={() => decide('accepted')}>Accepter</button>
        </div>
      </div>
    </div>
  );
}
