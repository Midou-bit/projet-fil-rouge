import { describe, expect, it } from 'vitest';
import axios from 'axios';
import { errorMessage } from './client';

function axiosErrorWith(data: unknown): unknown {
  return Object.assign(new Error('Request failed'), {
    isAxiosError: true,
    response: { data },
  });
}

describe('errorMessage', () => {
  it('extracts a single "message" field from the API error body', () => {
    const err = axiosErrorWith({ message: 'Stock insuffisant.' });
    expect(errorMessage(err)).toBe('Stock insuffisant.');
  });

  it('joins ASP.NET model-state "errors" arrays', () => {
    const err = axiosErrorWith({ errors: ['Email invalide.', 'Mot de passe trop court.'] });
    expect(errorMessage(err)).toBe('Email invalide. Mot de passe trop court.');
  });

  it('falls back to the default message for a non-axios error', () => {
    expect(errorMessage(new Error('boom'))).toBe('Une erreur est survenue.');
  });

  it('falls back to a custom message when provided', () => {
    expect(errorMessage(new Error('boom'), 'Échec de la connexion.')).toBe('Échec de la connexion.');
  });

  it('recognizes real axios errors via axios.isAxiosError', () => {
    // Sanity check that our helper is wired to the same axios instance used by api/client.ts.
    expect(axios.isAxiosError(axiosErrorWith({ message: 'x' }))).toBe(true);
  });
});
