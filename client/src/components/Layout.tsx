import { Suspense } from 'react';
import { Link, Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ErrorBoundary from './ErrorBoundary';
import CookieBanner from './CookieBanner';
import PrivacyPreferences from './PrivacyPreferences';

function PageFallback() {
  return (
    <div className="container center" role="status" aria-live="polite" style={{ padding: '4rem' }}>
      <div className="spinner" aria-hidden="true" style={{ margin: '0 auto' }} />
      <span className="sr-only">Chargement de la page…</span>
    </div>
  );
}

export default function Layout() {
  return (
    <>
      <a href="#main-content" className="skip-link">Aller au contenu principal</a>
      <Navbar />
      <main id="main-content" tabIndex={-1}
        style={{ minHeight: 'calc(100vh - 64px - 120px)', padding: '2rem 0 3rem' }}>
        <ErrorBoundary>
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="container" style={{ padding: '1.6rem 0', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontFamily: 'var(--font-title)', letterSpacing: '0.06em' }}>FRAME<span style={{ color: 'var(--accent-cyan)' }}>FORGE</span></strong>
            <p className="muted" style={{ fontSize: '0.82rem', margin: '0.3rem 0 0' }}>
              Projet pédagogique — boutique et paiement simulés, FPS estimés par modèle.
            </p>
          </div>
          <div className="row wrap" style={{ gap: '1.2rem', fontSize: '0.88rem' }}>
            <Link to="/boutique">Boutique</Link>
            <Link to="/jouer">Je veux jouer à…</Link>
            <Link to="/builder">Builder</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/confidentialite">Confidentialité</Link>
            <Link to="/conditions">Conditions & mentions légales</Link>
            <PrivacyPreferences />
          </div>
        </div>
      </footer>
      <CookieBanner />
    </>
  );
}
