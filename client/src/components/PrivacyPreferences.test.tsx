import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSENT_STORAGE_KEY } from '../lib/consent';

const analytics = vi.hoisted(() => ({
  configured: vi.fn(),
  load: vi.fn(),
  unload: vi.fn(),
}));

vi.mock('../lib/analytics', () => ({
  analyticsConfigured: analytics.configured,
  loadAnalytics: analytics.load,
  unloadAnalytics: analytics.unload,
}));

import PrivacyPreferences from './PrivacyPreferences';

describe('PrivacyPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
    analytics.configured.mockReset().mockReturnValue(false);
    analytics.load.mockReset();
    analytics.unload.mockReset();
  });

  it('affiche le choix courant et accepte les statistiques', async () => {
    render(<PrivacyPreferences />);
    await userEvent.click(screen.getByRole('button', { name: 'Préférences de confidentialité' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('aucun choix enregistré');
    expect(screen.getByText(/aucun code de site n’est configuré/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: "Accepter la mesure d'audience" }));
    expect(screen.getByRole('status')).toHaveTextContent('statistiques acceptées');
    expect(analytics.load).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) ?? '{}').choice).toBe('accepted');
  });

  it('permet de retirer le consentement puis de fermer au clavier', async () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
      choice: 'accepted', version: 1, updatedAt: '2026-09-21T12:00:00.000Z',
    }));
    render(<PrivacyPreferences />);
    const trigger = screen.getByRole('button', { name: 'Préférences de confidentialité' });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: 'Refuser / retirer mon accord' }));

    expect(screen.getByRole('status')).toHaveTextContent('statistiques refusées');
    expect(analytics.unload).toHaveBeenCalledTimes(1);

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
