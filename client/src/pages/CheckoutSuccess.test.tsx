import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('../api/endpoints', () => ({
  checkoutApi: { confirm: mocks.confirm },
}));

vi.mock('../context/CartContext', () => ({
  useCart: () => ({ refresh: mocks.refresh }),
}));

import CheckoutSuccess from './CheckoutSuccess';

function renderPage(entry = '/checkout/success?orderId=12') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <CheckoutSuccess />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CheckoutSuccess', () => {
  beforeEach(() => {
    mocks.confirm.mockReset();
    mocks.refresh.mockReset().mockResolvedValue(undefined);
  });

  it('does not trust simulated=1 and waits for the server before showing success', async () => {
    let resolveConfirmation!: (value: { status: 'Paid'; paymentMode: 'simulation' }) => void;
    mocks.confirm.mockReturnValue(new Promise((resolve) => { resolveConfirmation = resolve; }));
    renderPage('/checkout/success?orderId=12&simulated=1');

    expect(screen.getByRole('heading', { name: 'Validation serveur en cours' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Commande confirmée' })).not.toBeInTheDocument();
    expect(mocks.confirm).toHaveBeenCalledWith(12);

    await act(async () => resolveConfirmation({ status: 'Paid', paymentMode: 'simulation' }));

    expect(await screen.findByRole('heading', { name: 'Commande confirmée' })).toBeInTheDocument();
    expect(screen.getByText(/Paiement simulé/)).toHaveTextContent("aucun paiement réel n'a été effectué");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it('labels a Stripe test confirmation distinctly', async () => {
    mocks.confirm.mockResolvedValue({ status: 'Paid', paymentMode: 'stripe_test' });
    renderPage();

    expect(await screen.findByText('Paiement Stripe test confirmé')).toBeInTheDocument();
    expect(screen.queryByText(/Paiement simulé/)).not.toBeInTheDocument();
  });

  it('shows an error when server confirmation fails', async () => {
    mocks.confirm.mockRejectedValue(new Error('conflict'));
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Confirmation impossible' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Commande confirmée' })).not.toBeInTheDocument();
  });

  it('rejects an unexpected confirmation payload', async () => {
    mocks.confirm.mockResolvedValue({ status: 'Pending', paymentMode: 'simulation' });
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Confirmation impossible' })).toBeInTheDocument();
  });

  it('rejects a missing order id without calling the API', async () => {
    renderPage('/checkout/success?simulated=1');

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Confirmation impossible' })).toBeInTheDocument());
    expect(mocks.confirm).not.toHaveBeenCalled();
  });
});
