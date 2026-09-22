import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '../api/types';
import ProductCard from './ProductCard';

const mocks = vi.hoisted(() => ({
  useCart: vi.fn(),
  useAuth: vi.fn(),
  notify: vi.fn(),
  addItem: vi.fn(),
}));

vi.mock('../context/CartContext', () => ({ useCart: mocks.useCart }));
vi.mock('../context/AuthContext', () => ({ useAuth: mocks.useAuth }));
vi.mock('./Toast', () => ({ useToast: () => ({ notify: mocks.notify }) }));
vi.mock('../api/client', () => ({ errorMessage: () => 'Erreur panier' }));

const product: Product = {
  id: 42,
  name: 'GPU Test',
  brand: 'Forge',
  price: 499.9,
  stock: 3,
  description: 'Carte de test',
  perfScore: 82,
  categoryId: 1,
  categoryName: 'Cartes graphiques',
  categorySlug: 'gpu',
  averageRating: 0,
  reviewCount: 0,
};

function renderCard(value = product) {
  return render(<MemoryRouter><ProductCard product={value} /></MemoryRouter>);
}

describe('ProductCard', () => {
  beforeEach(() => {
    mocks.notify.mockReset();
    mocks.addItem.mockReset();
    mocks.useCart.mockReturnValue({ addItem: mocks.addItem });
    mocks.useAuth.mockReturnValue({ isAuthenticated: true });
  });

  it('affiche les informations et ajoute le produit au panier', async () => {
    mocks.addItem.mockResolvedValue(undefined);
    renderCard();

    expect(screen.getByRole('link', { name: /GPU Test/ })).toHaveAttribute('href', '/produit/42');
    expect(screen.getByLabelText('Performance : 82 sur 100')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter GPU Test au panier' }));

    await waitFor(() => expect(mocks.addItem).toHaveBeenCalledWith(42, 1));
    expect(mocks.notify).toHaveBeenCalledWith('GPU Test ajouté au panier.', 'success');
  });

  it('demande une connexion sans appeler le panier', async () => {
    mocks.useAuth.mockReturnValue({ isAuthenticated: false });
    renderCard();
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter GPU Test au panier' }));
    expect(mocks.addItem).not.toHaveBeenCalled();
    expect(mocks.notify).toHaveBeenCalledWith('Connecte-toi pour ajouter au panier.', 'info');
  });

  it('annonce une erreur et désactive un produit en rupture', async () => {
    mocks.addItem.mockRejectedValue(new Error('API down'));
    const { unmount } = renderCard();
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter GPU Test au panier' }));
    await waitFor(() => expect(mocks.notify).toHaveBeenCalledWith('Erreur panier', 'error'));
    unmount();

    renderCard({ ...product, stock: 0 });
    expect(screen.getByRole('button', { name: 'GPU Test indisponible' })).toBeDisabled();
    expect(screen.getByText('Rupture')).toBeInTheDocument();
  });
});
