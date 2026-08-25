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
      <div className="row wrap" style={{ gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.6rem', marginBottom: '1.4rem' }}>
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}
            className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-cyan' : 'btn-ghost'}`}>
            {t.label}
          </NavLink>
        ))}
      </div>
      <Suspense fallback={<div className="center" style={{ padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}>
        <Outlet />
      </Suspense>
    </div>
  );
}
