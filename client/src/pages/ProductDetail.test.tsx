import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product, Review } from '../api/types';
import ProductDetail from './ProductDetail';

const mocks = vi.hoisted(() => ({
  useProduct: vi.fn(),
  useReviews: vi.fn(),
  createReview: vi.fn(),
  useCart: vi.fn(),
  useAuth: vi.fn(),
  notify: vi.fn(),
  addItem: vi.fn(),
}));

vi.mock('../api/queries', () => ({
  qk: { reviews: (id: number) => ['reviews', id], product: (id: number) => ['product', id] },
  useProduct: mocks.useProduct,
  useReviews: mocks.useReviews,
}));
vi.mock('../api/endpoints', () => ({ reviewsApi: { create: mocks.createReview } }));
vi.mock('../context/CartContext', () => ({ useCart: mocks.useCart }));
vi.mock('../context/AuthContext', () => ({ useAuth: mocks.useAuth }));
vi.mock('../components/Toast', () => ({ useToast: () => ({ notify: mocks.notify }) }));

const product: Product = {
  id: 7,
  name: 'Forge RTX',
  brand: 'Frame',
  price: 749.5,
  stock: 4,
  description: 'Une carte graphique de test.',
  perfScore: 88,
  specs: '{"VRAM":"16 Go","Bus":"PCIe 4"}',
  categoryId: 1,
  categoryName: 'Carte graphique',
  categorySlug: 'gpu',
  averageRating: 4,
  reviewCount: 1,
};

const review: Review = {
  id: 2,
  rating: 4,
  comment: 'Très efficace.',
  author: 'client@frameforge.dev',
  createdAt: '2026-09-20T12:00:00Z',
};

function renderPage(entry = '/produit/7') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes><Route path="/produit/:id" element={<ProductDetail />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, invalidate };
}

describe('ProductDetail', () => {
  beforeEach(() => {
    mocks.notify.mockReset();
    mocks.addItem.mockReset().mockResolvedValue(undefined);
    mocks.createReview.mockReset().mockResolvedValue(review);
    mocks.useCart.mockReturnValue({ addItem: mocks.addItem });
    mocks.useAuth.mockReturnValue({ isAuthenticated: true });
    mocks.useProduct.mockReturnValue({ data: product, isLoading: false, isError: false });
    mocks.useReviews.mockReturnValue({ data: [review] });
  });

  it('rejette un identifiant invalide sans afficher une fiche', () => {
    renderPage('/produit/invalide');
    expect(screen.getByRole('heading', { name: 'Produit introuvable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Retour à la boutique' })).toHaveAttribute('href', '/boutique');
  });

  it('annonce le chargement du produit', () => {
    mocks.useProduct.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('Chargement du produit');
  });

  it('affiche la fiche, ajoute une quantité et publie un avis', async () => {
    const { invalidate } = renderPage();
    expect(screen.getByRole('heading', { name: 'Forge RTX' })).toBeInTheDocument();
    expect(screen.getByText('16 Go')).toBeInTheDocument();
    expect(screen.getAllByLabelText('4 sur 5')).not.toHaveLength(0);

    const quantity = screen.getByRole('spinbutton', { name: 'Quantité' });
    fireEvent.change(quantity, { target: { value: '2' } });
    await userEvent.click(screen.getAllByRole('button', { name: '🛒 Ajouter au panier' })[0]);
    await waitFor(() => expect(mocks.addItem).toHaveBeenCalledWith(7, 2));

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Note' }), '4');
    await userEvent.type(screen.getByRole('textbox', { name: 'Ton avis' }), 'Excellent rapport qualité prix');
    await userEvent.click(screen.getByRole('button', { name: 'Publier mon avis' }));
    await waitFor(() => expect(mocks.createReview).toHaveBeenCalledWith(7, 4, 'Excellent rapport qualité prix'));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['reviews', 7] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['product', 7] });
    expect(screen.getByRole('textbox', { name: 'Ton avis' })).toHaveValue('');
  });

  it('demande une connexion et masque le formulaire d’avis aux visiteurs', async () => {
    mocks.useAuth.mockReturnValue({ isAuthenticated: false });
    renderPage();
    expect(screen.queryByRole('button', { name: 'Publier mon avis' })).not.toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: '🛒 Ajouter au panier' })[0]);
    expect(mocks.addItem).not.toHaveBeenCalled();
    expect(mocks.notify).toHaveBeenCalledWith('Connecte-toi pour ajouter au panier.', 'info');
  });

  it('signale les erreurs d’ajout sans casser la fiche', async () => {
    mocks.addItem.mockRejectedValue(new Error('Stock indisponible'));
    renderPage();
    await userEvent.click(screen.getAllByRole('button', { name: '🛒 Ajouter au panier' })[0]);
    await waitFor(() => expect(mocks.notify).toHaveBeenCalledWith('Une erreur est survenue.', 'error'));
  });
});
