import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Layout from './Layout';
import Navbar from './Navbar';

const contextMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useCart: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({ useAuth: contextMocks.useAuth }));
vi.mock('../context/CartContext', () => ({ useCart: contextMocks.useCart }));
vi.mock('./CookieBanner', () => ({ default: () => <div data-testid="cookie-banner" /> }));
vi.mock('./PrivacyPreferences', () => ({ default: () => <button>Préférences de confidentialité</button> }));

describe('navigation et structure globale', () => {
  beforeEach(() => {
    contextMocks.logout.mockReset();
    contextMocks.useAuth.mockReturnValue({
      isAuthenticated: false,
      isAdmin: false,
      email: null,
      logout: contextMocks.logout,
    });
    contextMocks.useCart.mockReturnValue({ cart: null });
  });

  it('expose l’état du menu mobile et permet de le fermer au clavier', async () => {
    render(<MemoryRouter initialEntries={['/boutique']}><Navbar /></MemoryRouter>);
    const toggle = screen.getByLabelText('Ouvrir le menu principal');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'primary-navigation');
    expect(screen.getByRole('link', { name: 'Boutique' })).toHaveAttribute('aria-current', 'page');

    await userEvent.click(toggle);
    expect(screen.getByLabelText('Fermer le menu principal')).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    expect(screen.getByLabelText('Ouvrir le menu principal')).toHaveAttribute('aria-expanded', 'false');
  });

  it('annonce le nombre d’articles et affiche les actions du compte', async () => {
    contextMocks.useAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: true,
      email: 'admin@frameforge.dev',
      logout: contextMocks.logout,
    });
    contextMocks.useCart.mockReturnValue({ cart: { itemCount: 2 } });
    render(<MemoryRouter><Navbar /></MemoryRouter>);

    expect(screen.getByRole('link', { name: 'Panier, 2 articles' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sortir' }));
    expect(contextMocks.logout).toHaveBeenCalledTimes(1);
  });

  it('fournit un lien d’évitement et une cible principale focalisable', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<h1>Contenu test</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Aller au contenu principal' })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('heading', { name: 'Contenu test' })).toBeInTheDocument();
  });
});
