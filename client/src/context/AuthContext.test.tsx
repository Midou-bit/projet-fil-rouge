import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  setAuthToken: vi.fn(),
  onUnauthorized: vi.fn(),
}));

vi.mock('../api/endpoints', () => ({
  authApi: { login: apiMocks.login, register: apiMocks.register },
}));

vi.mock('../api/client', () => ({
  setAuthToken: apiMocks.setAuthToken,
  onUnauthorized: apiMocks.onUnauthorized,
}));

import { AuthProvider, useAuth } from './AuthContext';

function Consumer() {
  const auth = useAuth();
  const [error, setError] = useState('');
  return (
    <div>
      <output data-testid="session">{auth.email ?? 'anonymous'}:{auth.role ?? 'none'}</output>
      <output data-testid="flags">{String(auth.isAuthenticated)}:{String(auth.isAdmin)}</output>
      <output data-testid="error">{error}</output>
      <button onClick={() => auth.login('client@example.test', 'ValidPassword1!').catch((e: Error) => setError(e.message))}>login</button>
      <button onClick={() => auth.register('new@example.test', 'ValidPassword1!')}>register</button>
      <button onClick={auth.logout}>logout</button>
    </div>
  );
}

function renderAuth(queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider><Consumer /></AuthProvider>
      </QueryClientProvider>,
    ),
  };
}

describe('AuthContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
    apiMocks.login.mockReset();
    apiMocks.register.mockReset();
    apiMocks.setAuthToken.mockReset();
    apiMocks.onUnauthorized.mockReset();
  });

  it('restaure une session valide avant le premier rendu', () => {
    sessionStorage.setItem('frameforge.session', JSON.stringify({
      token: 'restored-token', email: 'admin@example.test', role: 'Admin',
    }));

    renderAuth();

    expect(screen.getByTestId('session')).toHaveTextContent('admin@example.test:Admin');
    expect(screen.getByTestId('flags')).toHaveTextContent('true:true');
    expect(apiMocks.setAuthToken).toHaveBeenCalledWith('restored-token');
  });

  it('ignore un stockage corrompu', () => {
    sessionStorage.setItem('frameforge.session', '{invalid');

    renderAuth();

    expect(screen.getByTestId('session')).toHaveTextContent('anonymous:none');
    expect(screen.getByTestId('flags')).toHaveTextContent('false:false');
  });

  it('connecte, persiste la session et purge le cache de l’identité précédente', async () => {
    apiMocks.login.mockResolvedValue({ token: 'client-token', email: 'client@example.test', role: 'Client' });
    const queryClient = new QueryClient();
    queryClient.setQueryData(['orders', 'mine'], [{ id: 99 }]);
    renderAuth(queryClient);

    await userEvent.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('client@example.test:Client'));
    expect(apiMocks.login).toHaveBeenCalledWith('client@example.test', 'ValidPassword1!');
    expect(queryClient.getQueryData(['orders', 'mine'])).toBeUndefined();
    expect(JSON.parse(sessionStorage.getItem('frameforge.session') ?? '{}')).toEqual({
      token: 'client-token', email: 'client@example.test', role: 'Client',
    });
  });

  it('inscrit un utilisateur avec la même isolation de session', async () => {
    apiMocks.register.mockResolvedValue({ token: 'new-token', email: 'new@example.test', role: 'Client' });
    renderAuth();

    await userEvent.click(screen.getByRole('button', { name: 'register' }));

    await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('new@example.test:Client'));
    expect(apiMocks.register).toHaveBeenCalledWith('new@example.test', 'ValidPassword1!');
  });

  it('propage une erreur de connexion sans créer de session', async () => {
    apiMocks.login.mockRejectedValue(new Error('Identifiants invalides'));
    renderAuth();

    await userEvent.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Identifiants invalides'));
    expect(screen.getByTestId('flags')).toHaveTextContent('false:false');
    expect(sessionStorage.getItem('frameforge.session')).toBeNull();
  });

  it('déconnecte et efface les données privées en cache', async () => {
    sessionStorage.setItem('frameforge.session', JSON.stringify({
      token: 'client-token', email: 'client@example.test', role: 'Client',
    }));
    const queryClient = new QueryClient();
    queryClient.setQueryData(['orders', 'mine'], [{ id: 1 }]);
    renderAuth(queryClient);

    await userEvent.click(screen.getByRole('button', { name: 'logout' }));

    expect(screen.getByTestId('session')).toHaveTextContent('anonymous:none');
    expect(queryClient.getQueryData(['orders', 'mine'])).toBeUndefined();
    expect(sessionStorage.getItem('frameforge.session')).toBeNull();
    expect(apiMocks.setAuthToken).toHaveBeenCalledWith(null);
  });

  it('déconnecte aussi sur le callback 401 global', async () => {
    sessionStorage.setItem('frameforge.session', JSON.stringify({
      token: 'expired-token', email: 'client@example.test', role: 'Client',
    }));
    const queryClient = new QueryClient();
    queryClient.setQueryData(['orders', 'mine'], [{ id: 2 }]);
    renderAuth(queryClient);
    const unauthorized = apiMocks.onUnauthorized.mock.calls[0]?.[0] as (() => void) | undefined;

    act(() => unauthorized?.());

    await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('anonymous:none'));
    expect(queryClient.getQueryData(['orders', 'mine'])).toBeUndefined();
  });
});
