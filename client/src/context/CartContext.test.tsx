import { useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartProvider, useCart } from './CartContext';
import { AuthProvider, useAuth } from './AuthContext';
import type { Cart } from '../api/types';

const emptyCart: Cart = { items: [], total: 0, itemCount: 0 };
const cartWithOneItem: Cart = {
  items: [{ id: 1, productId: 42, productName: 'RTX 5090', unitPrice: 2000, quantity: 1, stock: 5, lineTotal: 2000 }],
  total: 2000,
  itemCount: 1,
};

vi.mock('../api/endpoints', () => ({
  cartApi: {
    get: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  },
  authApi: { login: vi.fn(), register: vi.fn() },
}));

// Imported after the mock so it resolves to the mocked module.
const { cartApi } = await import('../api/endpoints');
const { authApi } = await import('../api/endpoints');

function TestConsumer() {
  const { cart, addItem, removeItem } = useCart();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <span data-testid="count">{cart?.itemCount ?? 'null'}</span>
      <span data-testid="error">{error ?? ''}</span>
      <button onClick={() => { setError(null); addItem(42, 1).catch((e: Error) => setError(e.message)); }}>add</button>
      <button onClick={() => removeItem(1)}>remove</button>
    </div>
  );
}

function IdentitySwitcher() {
  const { cart } = useCart();
  const { login } = useAuth();
  return (
    <div>
      <span data-testid="race-count">{cart?.itemCount ?? 'null'}</span>
      <button onClick={() => void login('b@frameforge.dev', 'long-enough-password')}>switch</button>
    </div>
  );
}

function renderCart() {
  sessionStorage.setItem('frameforge.session', JSON.stringify({ token: 'fake-token', email: 'a@b.dev', role: 'Client' }));
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

function renderIdentitySwitcher() {
  sessionStorage.setItem('frameforge.session', JSON.stringify({ token: 'token-a', email: 'a@frameforge.dev', role: 'Client' }));
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <IdentitySwitcher />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('CartContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(cartApi.get).mockReset().mockResolvedValue(emptyCart);
    vi.mocked(cartApi.add).mockReset();
    vi.mocked(cartApi.remove).mockReset();
    vi.mocked(authApi.login).mockReset();
  });

  it('fetches the cart on mount for an authenticated user', async () => {
    renderCart();
    await waitFor(() => expect(cartApi.get).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('updates cart state after addItem resolves', async () => {
    vi.mocked(cartApi.add).mockResolvedValue(cartWithOneItem);
    renderCart();
    await waitFor(() => expect(cartApi.get).toHaveBeenCalled());

    await userEvent.click(screen.getByText('add'));

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    expect(cartApi.add).toHaveBeenCalledWith(42, 1);
  });

  it('propagates addItem failures to the caller instead of swallowing them', async () => {
    vi.mocked(cartApi.add).mockRejectedValue(new Error('Stock insuffisant'));
    renderCart();
    await waitFor(() => expect(cartApi.get).toHaveBeenCalled());

    // CartContext.addItem itself has no internal try/catch — this proves the rejection reaches
    // the caller (here caught explicitly by TestConsumer, exactly like ProductCard/CartPage do).
    await userEvent.click(screen.getByText('add'));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Stock insuffisant'));
  });

  it('ignores a late cart response from the previous authenticated identity', async () => {
    let resolveFirst!: (value: Cart) => void;
    const firstRequest = new Promise<Cart>((resolve) => { resolveFirst = resolve; });
    const secondIdentityCart: Cart = { ...cartWithOneItem, itemCount: 2 };
    vi.mocked(cartApi.get)
      .mockReset()
      .mockImplementationOnce(() => firstRequest)
      .mockResolvedValueOnce(secondIdentityCart);
    vi.mocked(authApi.login).mockResolvedValue({ token: 'token-b', email: 'b@frameforge.dev', role: 'Client' });

    renderIdentitySwitcher();
    await waitFor(() => expect(cartApi.get).toHaveBeenCalledTimes(1));
    await userEvent.click(screen.getByText('switch'));
    await waitFor(() => expect(cartApi.get).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByTestId('race-count')).toHaveTextContent('2'));

    await act(async () => { resolveFirst(cartWithOneItem); });
    expect(screen.getByTestId('race-count')).toHaveTextContent('2');
  });
});
