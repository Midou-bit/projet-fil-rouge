import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { errorMessage } from '../api/client';
import { useSeo } from '../lib/seo';

export default function Login() {
  useSeo('Connexion', 'Connecte-toi ou crée ton compte FrameForge pour composer, sauvegarder et commander ton build.');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  // Erreur affichée DANS le formulaire et conservée jusqu'à correction : une notification
  // flottante disparaît en 3 secondes, or la règle de mot de passe fait plusieurs lignes.
  const [error, setError] = useState<string | null>(null);
  const { login, register } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      notify('Bienvenue sur FrameForge.', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err, mode === 'login' ? 'Échec de la connexion.' : 'Échec de la création du compte.'));
    } finally {
      setBusy(false);
    }
  }

  function demo(role: 'admin' | 'client') {
    setEmail(role === 'admin' ? 'admin@frameforge.dev' : 'client@frameforge.dev');
    setPassword(role === 'admin' ? 'AdminFrame2026!' : 'ClientFrame2026!');
    setMode('login');
  }

  return (
    <div className="container" style={{ maxWidth: 440 }}>
      <div className="surface" style={{ padding: '2rem' }}>
        <h1 style={{ marginTop: 0 }}>{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h1>
        <form onSubmit={submit} className="stack">
          <div>
            <label htmlFor="login-email">Email</label>
            <input id="login-email" type="email" required value={email} aria-invalid={error ? true : undefined}
              onChange={(e) => { setEmail(e.target.value); setError(null); }} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="login-password">Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input id="login-password" type={showPassword ? 'text' : 'password'} required
                minLength={mode === 'register' ? 12 : undefined} value={password}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'login-error' : undefined}
                onChange={(e) => { setPassword(e.target.value); setError(null); }} style={{ paddingRight: '2.6rem' }}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                aria-pressed={showPassword}
                style={{
                  position: 'absolute', right: 0, top: 0, bottom: 0, width: '2.6rem',
                  background: 'transparent', border: 'none', fontSize: '1.1rem',
                  display: 'grid', placeItems: 'center', color: 'var(--text-muted)',
                }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {mode === 'register' && (
              <span className="muted" style={{ fontSize: '0.78rem', display: 'block', marginTop: '0.3rem' }}>
                Min. 12 caractères, avec majuscule, minuscule, chiffre et caractère spécial (reco CNIL).
              </span>
            )}
          </div>
          {error && (
            <p id="login-error" role="alert" className="form-error">{error}</p>
          )}
          <button className="btn btn-action btn-block" disabled={busy}>
            {busy ? '…' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>
        <p className="muted center" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          {mode === 'login' ? 'Pas de compte ?' : 'Déjà inscrit ?'}{' '}
          <button className="btn btn-sm btn-ghost" type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}>
            {mode === 'login' ? "S'inscrire" : 'Se connecter'}
          </button>
        </p>

        {/* Comptes de démonstration, visibles AUSSI en production : FrameForge est un projet
            de démonstration dont la base est réinitialisée à chaque déploiement. Un visiteur
            doit pouvoir parcourir le tunnel d'achat et l'espace d'administration sans créer de
            compte. Les identifiants sont de toute façon publiés dans le README du dépôt. */}
        <div className="surface" style={{ padding: '0.9rem', marginTop: '1rem', background: 'var(--bg)' }}>
          <p className="muted" style={{ fontSize: '0.8rem', margin: '0 0 0.6rem', fontFamily: 'var(--font-mono)' }}>
            Comptes de démonstration, un clic pour remplir :
          </p>
          <div className="row wrap" style={{ gap: '0.5rem' }}>
            <button type="button" className="btn btn-sm" onClick={() => demo('client')}
              title="client@frameforge.dev">
              Client
            </button>
            <button type="button" className="btn btn-sm" onClick={() => demo('admin')}
              title="admin@frameforge.dev">
              Administrateur
            </button>
          </div>
          <p className="muted" style={{ fontSize: '0.72rem', margin: '0.6rem 0 0', lineHeight: 1.5 }}>
            <code>client@frameforge.dev</code> · <code>ClientFrame2026!</code><br />
            <code>admin@frameforge.dev</code> · <code>AdminFrame2026!</code>
          </p>
        </div>
      </div>
    </div>
  );
}
