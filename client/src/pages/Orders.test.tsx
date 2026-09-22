import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountExport, Order } from '../api/types';
import Orders from './Orders';

const mocks = vi.hoisted(() => ({
  useMyOrders: vi.fn(),
  cancel: vi.fn(),
  exportData: vi.fn(),
  remove: vi.fn(),
  logout: vi.fn(),
  notify: vi.fn(),
  createObjectURL: vi.fn(),
  revokeObjectURL: vi.fn(),
}));

vi.mock('../api/queries', () => ({
  qk: { myOrders: ['orders', 'mine'] },
  useMyOrders: mocks.useMyOrders,
}));
vi.mock('../api/endpoints', () => ({
  accountApi: { exportData: mocks.exportData, remove: mocks.remove },
  ordersApi: { cancel: mocks.cancel },
}));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ email: 'client@frameforge.dev', logout: mocks.logout }),
}));
vi.mock('../components/Toast', () => ({ useToast: () => ({ notify: mocks.notify }) }));

const order: Order = {
  id: 12,
  totalPrice: 999.9,
  status: 'Pending',
  createdAt: '2026-09-20T10:00:00Z',
  items: [{ productId: 7, productName: 'Forge RTX', unitPrice: 999.9, quantity: 1 }],
};

const exported: AccountExport = {
  exportedAtUtc: '2026-09-21T10:00:00Z',
  account: { email: 'client@frameforge.dev', createdAt: '2026-01-01T00:00:00Z', roles: ['Client'] },
  cart: { items: [], total: 0 },
  orders: [],
  reviews: [],
  supportMessages: [],
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/commandes']}>
        <Routes>
          <Route path="/commandes" element={<Orders />} />
          <Route path="/" element={<h1>Accueil après suppression</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, invalidate };
}

describe('Orders et contrôles des données', () => {
  beforeEach(() => {
    mocks.useMyOrders.mockReturnValue({ data: [order], isLoading: false });
    mocks.cancel.mockReset().mockResolvedValue({ ...order, status: 'Cancelled' });
    mocks.exportData.mockReset().mockResolvedValue(exported);
    mocks.remove.mockReset().mockResolvedValue(undefined);
    mocks.logout.mockReset();
    mocks.notify.mockReset();
    mocks.createObjectURL.mockReset().mockReturnValue('blob:frameforge-export');
    mocks.revokeObjectURL.mockReset();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: mocks.createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: mocks.revokeObjectURL });
  });

  it('affiche les commandes et permet d’annuler une commande en attente', async () => {
    const { invalidate } = renderPage();
    expect(screen.getByText('Commande #12')).toBeInTheDocument();
    expect(screen.queryByText('Payée')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Annuler la commande' }));
    await waitFor(() => expect(mocks.cancel).toHaveBeenCalledWith(12));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['orders', 'mine'] });
    expect(mocks.notify).toHaveBeenCalledWith('Commande annulée.', 'success');
  });

  it('télécharge uniquement l’export JSON renvoyé par le compte', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Télécharger mes données' }));

    await waitFor(() => expect(mocks.exportData).toHaveBeenCalledTimes(1));
    const blob = mocks.createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json');
    expect(await blob.text()).toContain('client@frameforge.dev');
    expect(click).toHaveBeenCalledTimes(1);
    expect(mocks.revokeObjectURL).toHaveBeenCalledWith('blob:frameforge-export');
    expect(mocks.notify).toHaveBeenCalledWith('Tes données ont été exportées.', 'success');
    click.mockRestore();
  });

  it('annonce un échec d’export sans lancer de téléchargement', async () => {
    mocks.exportData.mockRejectedValue(new Error('offline'));
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Télécharger mes données' }));
    await waitFor(() => expect(mocks.notify).toHaveBeenCalledWith("L'export de tes données a échoué.", 'error'));
    expect(mocks.createObjectURL).not.toHaveBeenCalled();
  });

  it('demande confirmation avant l’effacement puis ferme la session', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    renderPage();
    const button = screen.getByRole('button', { name: 'Supprimer mon compte et ses données liées' });
    await userEvent.click(button);
    expect(mocks.remove).not.toHaveBeenCalled();

    await userEvent.click(button);
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledTimes(1));
    expect(mocks.logout).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Accueil après suppression' })).toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  it('annonce le chargement et l’état sans commande', () => {
    mocks.useMyOrders.mockReturnValueOnce({ data: [], isLoading: true });
    const { unmount } = renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('Chargement de tes commandes');
    unmount();

    mocks.useMyOrders.mockReturnValue({ data: [], isLoading: false });
    renderPage();
    expect(screen.getByText('Aucune commande pour l’instant.')).toBeInTheDocument();
  });
});
