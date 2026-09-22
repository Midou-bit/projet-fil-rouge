import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/produits', label: 'Produits' },
  { to: '/admin/categories', label: 'Catégories' },
  { to: '/admin/commandes', label: 'Commandes' },
  { to: '/admin/support', label: 'Support' },
];

export default function AdminLayout() {
  return (
    <div className="container">
      <div className="row between wrap" style={{ marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>⚙️ Administration</h1>
        <span className="badge badge-cyan">Espace admin</span>
      </div>
      <nav className="row wrap" aria-label="Navigation de l'administration" style={{ gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.6rem', marginBottom: '1.4rem' }}>
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}
            className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-cyan' : 'btn-ghost'}`}>
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Suspense fallback={<div className="center" role="status" aria-live="polite" style={{ padding: '2rem' }}>
        <div className="spinner" aria-hidden="true" style={{ margin: '0 auto' }} />
        <span className="sr-only">Chargement de la page d'administration…</span>
      </div>}>
        <Outlet />
      </Suspense>
    </div>
  );
}
