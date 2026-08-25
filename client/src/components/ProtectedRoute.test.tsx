import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';

function renderProtected(adminOnly = false) {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Page de connexion</div>} />
          <Route path="/" element={<div>Accueil</div>} />
          <Route
            path="/protected"
            element={<ProtectedRoute adminOnly={adminOnly}><div>Contenu protégé</div></ProtectedRoute>}
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => sessionStorage.clear());

  it('redirects to /login when not authenticated', () => {
    renderProtected();
    expect(screen.getByText('Page de connexion')).toBeInTheDocument();
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    sessionStorage.setItem('frameforge.session', JSON.stringify({ token: 'fake-token', email: 'a@b.dev', role: 'Client' }));
    renderProtected();
    expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
  });

  it('redirects a non-admin user away from an admin-only route', () => {
    sessionStorage.setItem('frameforge.session', JSON.stringify({ token: 'fake-token', email: 'a@b.dev', role: 'Client' }));
    renderProtected(true);
    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });

  it('lets an admin through an admin-only route', () => {
    sessionStorage.setItem('frameforge.session', JSON.stringify({ token: 'fake-token', email: 'a@b.dev', role: 'Admin' }));
    renderProtected(true);
    expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
  });
});
