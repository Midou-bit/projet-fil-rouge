import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Shop from './Shop';

const queryMocks = vi.hoisted(() => ({
  useProducts: vi.fn(),
  useCategories: vi.fn(),
  useBrands: vi.fn(),
}));

vi.mock('../api/queries', () => queryMocks);
vi.mock('../components/ProductCard', () => ({
  default: ({ product }: { product: { name: string } }) => <article>{product.name}</article>,
}));

const product = {
  id: 1,
  name: 'RTX Test',
  brand: 'Forge',
  price: 500,
  stock: 2,
  description: 'Test',
  perfScore: 80,
  categoryId: 1,
  categoryName: 'GPU',
  categorySlug: 'gpu',
  averageRating: 0,
  reviewCount: 0,
};

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.search}</output>;
}

function renderPage(entry = '/boutique') {
  return render(<MemoryRouter initialEntries={[entry]}><Shop /><LocationProbe /></MemoryRouter>);
}

describe('Shop', () => {
  beforeEach(() => {
    queryMocks.useCategories.mockReturnValue({ data: [{ id: 1, name: 'GPU', slug: 'gpu', productCount: 1 }] });
    queryMocks.useBrands.mockReturnValue({ data: ['Forge'] });
    queryMocks.useProducts.mockReturnValue({
      data: { items: [product], total: 25, page: 1, pageSize: 12, totalPages: 3 },
      isLoading: false,
    });
  });

  it('rend des filtres nommés et synchronise filtres et pagination dans l’URL', async () => {
    renderPage('/boutique?page=2&sort=price_desc');
    expect(screen.getByRole('searchbox', { name: 'Recherche' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Catégorie' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Pagination des produits' })).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Catégorie' }), 'gpu');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('category=gpu'));
    expect(screen.getByTestId('location')).toHaveTextContent('page=1');

    await userEvent.click(screen.getByRole('button', { name: 'Suiv. →' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('page=2'));
  });

  it('debounce la recherche avant de modifier l’URL', async () => {
    renderPage();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Recherche' }), 'RTX');
    expect(screen.getByTestId('location')).not.toHaveTextContent('search=');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('search=RTX'), { timeout: 1000 });
  });

  it('annonce le chargement et gère un catalogue vide', () => {
    queryMocks.useProducts.mockReturnValueOnce({ data: undefined, isLoading: true });
    const { unmount } = renderPage();
    expect(screen.getByText('Chargement des produits…').closest('[role="status"]')).toBeInTheDocument();
    unmount();

    queryMocks.useProducts.mockReturnValue({
      data: { items: [], total: 0, page: 1, pageSize: 12, totalPages: 0 },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByText('Aucun produit ne correspond à ces filtres.')).toBeInTheDocument();
  });
});
