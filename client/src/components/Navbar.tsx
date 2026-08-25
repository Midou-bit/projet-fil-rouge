import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const links = [
  { to: '/boutique', label: 'Boutique' },
  { to: '/jeux', label: 'Jeux' },
  { to: '/jouer', label: 'Je veux jouer à…' },
  { to: '/verificateur', label: 'Vérificateur' },
  { to: '/builder', label: 'Builder' },
];

export default function Navbar() {
  const { isAuthenticated, isAdmin, email, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const count = cart?.itemCount ?? 0;

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,14,20,0.85)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <nav className="container row between" style={{ height: 64 }}>
        <Link to="/" className="glitch" style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.35rem', color: 'var(--text)', letterSpacing: '0.06em' }}>
          FRAME<span style={{ color: 'var(--accent-cyan)' }}>FORGE</span>
        </Link>

        <button className="btn btn-sm btn-ghost mobile-only" onClick={() => setOpen((o) => !o)} aria-label="Menu">☰</button>

        <div className={`nav-links ${open ? 'open' : ''}`}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="row" style={{ gap: '0.6rem' }}>
          <Link to="/panier" className="btn btn-sm btn-cyan" style={{ position: 'relative' }}
            aria-label={count > 0 ? `Panier, ${count} article${count > 1 ? 's' : ''}` : 'Panier'}>
            <span aria-hidden>🛒</span>
            {count > 0 && (
              <span aria-hidden style={{
                position: 'absolute', top: -6, right: -6, background: 'var(--accent-yellow)',
                color: '#0a0e14', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700,
                minWidth: 18, height: 18, display: 'grid', placeItems: 'center', padding: '0 4px',
              }}>{count}</span>
            )}
          </Link>
          {isAuthenticated ? (
            <div className="row" style={{ gap: '0.4rem' }}>
              {isAdmin && <Link to="/admin" className="btn btn-sm">Admin</Link>}
              <Link to="/commandes" className="btn btn-sm btn-ghost" title={email ?? ''}>Compte</Link>
              <button className="btn btn-sm btn-ghost" onClick={() => { logout(); navigate('/'); }}>Sortir</button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-sm">Connexion</Link>
          )}
        </div>
      </nav>

      <style>{`
        .nav-links { display: flex; gap: 0.3rem; }
        .nav-link { padding: 0.45rem 0.8rem; border-radius: 8px; color: var(--text-muted); font-size: 0.92rem; font-weight: 500; transition: all var(--transition); }
        .nav-link:hover { color: var(--text); background: var(--surface-hi); }
        .nav-link.active { color: var(--accent-cyan); background: rgba(34,211,238,0.1); }
        .mobile-only { display: none; }
        @media (max-width: 860px) {
          .mobile-only { display: inline-flex; }
          .nav-links { position: absolute; top: 64px; left: 0; right: 0; flex-direction: column; background: var(--surface); border-bottom: 1px solid var(--border); padding: 0.5rem; display: none; }
          .nav-links.open { display: flex; }
        }
      `}</style>
    </header>
  );
}
