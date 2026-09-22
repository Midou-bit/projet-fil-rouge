import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mocks.login, register: mocks.register }),
}));

vi.mock('../components/Toast', () => ({
  useToast: () => ({ notify: mocks.notify }),
}));

import Login from './Login';

function renderLogin(initialEntry: string | { pathname: string; state?: unknown } = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/destination" element={<h1>Destination privée</h1>} />
        <Route path="/" element={<h1>Accueil</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Login', () => {
  beforeEach(() => {
    mocks.login.mockReset();
    mocks.register.mockReset();
    mocks.notify.mockReset();
  });

  it('connecte puis revient vers la route privée demandée', async () => {
    mocks.login.mockResolvedValue(undefined);
    renderLogin({ pathname: '/login', state: { from: '/destination' } });

    await userEvent.type(screen.getByLabelText('Email'), 'client@example.test');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'ValidPassword1!');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Destination privée' })).toBeInTheDocument());
    expect(mocks.login).toHaveBeenCalledWith('client@example.test', 'ValidPassword1!');
    expect(mocks.notify).toHaveBeenCalledWith('Bienvenue sur FrameForge.', 'success');
  });

  it('affiche une erreur persistante et la retire quand le champ est corrigé', async () => {
    mocks.login.mockRejectedValue(new Error('Identifiants invalides'));
    renderLogin();

    const email = screen.getByLabelText('Email');
    await userEvent.type(email, 'client@example.test');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Échec de la connexion.');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(email, 'x');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('bascule en inscription, révèle le mot de passe et crée le compte', async () => {
    mocks.register.mockResolvedValue(undefined);
    renderLogin();

    await userEvent.click(screen.getByRole('button', { name: "S'inscrire" }));
    expect(screen.getByRole('heading', { name: 'Créer un compte' })).toBeInTheDocument();
    const password = screen.getByLabelText('Mot de passe');
    expect(password).toHaveAttribute('minlength', '12');
    await userEvent.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Masquer le mot de passe' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.type(screen.getByLabelText('Email'), 'new@example.test');
    await userEvent.type(password, 'ValidPassword1!');
    await userEvent.click(screen.getByRole('button', { name: "S'inscrire" }));

    await waitFor(() => expect(mocks.register).toHaveBeenCalledWith('new@example.test', 'ValidPassword1!'));
    expect(screen.getByRole('heading', { name: 'Accueil' })).toBeInTheDocument();
  });

  it('remplit explicitement chacun des comptes de démonstration', async () => {
    renderLogin();
    const email = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Mot de passe');

    await userEvent.click(screen.getByRole('button', { name: 'Client' }));
    expect(email).toHaveValue('client@frameforge.dev');
    expect(password).toHaveValue('ClientFrame2026!');

    await userEvent.click(screen.getByRole('button', { name: 'Administrateur' }));
    expect(email).toHaveValue('admin@frameforge.dev');
    expect(password).toHaveValue('AdminFrame2026!');
  });
});
