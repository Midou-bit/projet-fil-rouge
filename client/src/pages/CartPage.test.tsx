import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  notify: vi.fn(),
  updateItem: vi.fn(),
  removeItem: vi.fn(),
}));

vi.mock('../api/endpoints', () => ({ checkoutApi: { create: mocks.create } }));
vi.mock('../components/Toast', () => ({ useToast: () => ({ notify: mocks.notify }) }));
vi.mock('../context/CartContext', () => ({
  useCart: () => ({
    cart: {
      items: [{
        id: 1,
        productId: 7,
        productName: 'GPU test',
        unitPrice: 250,
        quantity: 1,
        stock: 3,
        lineTotal: 250,
      }],
      total: 250,
      itemCount: 1,
    },
    loading: false,
    updateItem: mocks.updateItem,
    removeItem: mocks.removeItem,
  }),
}));

import CartPage from './CartPage';

function Destination() {
  const location = useLocation();
  return <p>destination:{location.search}</p>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/panier']}>
      <Routes>
        <Route path="/panier" element={<CartPage />} />
        <Route path="/checkout/success" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CartPage checkout mode', () => {
  beforeEach(() => {
    mocks.create.mockReset();
    mocks.notify.mockReset();
    mocks.updateItem.mockReset();
    mocks.removeItem.mockReset();
  });

  it('routes a simulation to mandatory server confirmation without a trusted simulated flag', async () => {
    mocks.create.mockResolvedValue({ orderId: 42, paymentMode: 'simulation' });
    renderPage();

    expect(screen.getByText(/mode de démonstration actif/i)).toBeInTheDocument();
    expect(screen.queryByText(/Stripe test/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/4242 4242/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Valider la commande/ }));

    expect(await screen.findByText('destination:?orderId=42')).toBeInTheDocument();
    expect(screen.queryByText(/simulated=1/)).not.toBeInTheDocument();
  });

  it('reports an invalid server mode instead of claiming success', async () => {
    mocks.create.mockResolvedValue({ orderId: 42, paymentMode: 'unknown' });
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Valider la commande/ }));

    expect(mocks.notify).toHaveBeenCalledWith('Mode de paiement serveur invalide.', 'error');
  });
});
