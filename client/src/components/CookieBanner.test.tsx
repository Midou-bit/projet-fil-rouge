import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSENT_STORAGE_KEY } from '../lib/consent';

const analytics = vi.hoisted(() => ({ load: vi.fn(), unload: vi.fn() }));
vi.mock('../lib/analytics', () => ({
  loadAnalytics: analytics.load,
  unloadAnalytics: analytics.unload,
}));

import CookieBanner from './CookieBanner';

function renderBanner() {
  return render(<MemoryRouter><CookieBanner /></MemoryRouter>);
}

describe('CookieBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    analytics.load.mockReset();
    analytics.unload.mockReset();
  });

  it('propose un choix symétrique tant qu’aucune préférence n’existe', () => {
    renderBanner();
    expect(screen.getByRole('dialog', { name: 'Préférences de confidentialité' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refuser' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accepter' })).toBeInTheDocument();
  });

  it('charge analytics seulement après acceptation', async () => {
    renderBanner();
    await userEvent.click(screen.getByRole('button', { name: 'Accepter' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(analytics.load).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) ?? '{}').choice).toBe('accepted');
  });

  it('enregistre le refus sans charger analytics', async () => {
    renderBanner();
    await userEvent.click(screen.getByRole('button', { name: 'Refuser' }));

    expect(analytics.unload).toHaveBeenCalledTimes(1);
    expect(analytics.load).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) ?? '{}').choice).toBe('refused');
  });

  it('respecte une acceptation déjà enregistrée au chargement', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    renderBanner();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(analytics.load).toHaveBeenCalledTimes(1);
  });
});
