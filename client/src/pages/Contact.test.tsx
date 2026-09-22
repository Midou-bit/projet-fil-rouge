import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Contact from './Contact';

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  notify: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('../api/endpoints', () => ({ supportApi: { send: mocks.send } }));
vi.mock('../context/AuthContext', () => ({ useAuth: mocks.useAuth }));
vi.mock('../components/Toast', () => ({ useToast: () => ({ notify: mocks.notify }) }));

function renderPage() {
  return render(<MemoryRouter><Contact /></MemoryRouter>);
}

describe('Contact', () => {
  beforeEach(() => {
    mocks.send.mockReset();
    mocks.notify.mockReset();
    mocks.useAuth.mockReturnValue({ email: 'client@frameforge.dev' });
  });

  it('préremplit le compte connecté, envoie puis permet un nouveau message', async () => {
    mocks.send.mockResolvedValue(undefined);
    renderPage();

    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('client@frameforge.dev');
    await userEvent.type(screen.getByRole('textbox', { name: 'Sujet' }), 'Commande');
    await userEvent.type(screen.getByRole('textbox', { name: 'Message' }), 'Où en est la commande ?');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }));

    await waitFor(() => expect(mocks.send).toHaveBeenCalledWith(
      'client@frameforge.dev',
      'Commande',
      'Où en est la commande ?',
    ));
    expect(screen.getByText(/Notre équipe te répondra/)).toBeInTheDocument();
    expect(mocks.notify).toHaveBeenCalledWith('Message envoyé !', 'success');

    await userEvent.click(screen.getByRole('button', { name: 'Envoyer un autre message' }));
    expect(screen.getByRole('textbox', { name: 'Sujet' })).toHaveValue('');
  });

  it('conserve le formulaire, annonce l’erreur puis l’efface à la correction', async () => {
    mocks.send.mockRejectedValue(new Error('offline'));
    renderPage();
    await userEvent.type(screen.getByRole('textbox', { name: 'Sujet' }), 'Aide');
    await userEvent.type(screen.getByRole('textbox', { name: 'Message' }), 'Mon message important');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("L'envoi a échoué");
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('Mon message important');
    await userEvent.type(screen.getByRole('textbox', { name: 'Sujet' }), ' corrigé');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
