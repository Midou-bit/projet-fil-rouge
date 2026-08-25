import axios from 'axios';

// baseURL relatif → proxifié vers l'API par Vite (dev), nginx (Docker) ou _redirects (Netlify).
// timeout : sans lui, une requête vers une API pas encore prête (cold-start) reste pendante
// indéfiniment côté navigateur → spinner infini. 30s couvre le réveil d'un conteneur endormi
// sur une offre d'hébergement gratuite (Render met ~50s à froid, d'où les retries côté React Query).
export const api = axios.create({ baseURL: '/api', timeout: 30000 });

// Token JWT injecté sur chaque requête (la source persistée est gérée par AuthContext).
let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

// Callback déclenché sur un 401 d'une requête AUTHENTIFIÉE (token expiré/invalide) → AuthContext purge la session.
let unauthorizedCb: (() => void) | null = null;
export function onUnauthorized(cb: () => void) {
  unauthorizedCb = cb;
}

api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    // On ne réagit qu'aux 401 sur une requête qui PORTAIT un token (sinon = simple échec de login).
    if (axios.isAxiosError(error) && error.response?.status === 401 && error.config?.headers?.Authorization) {
      unauthorizedCb?.();
    }
    return Promise.reject(error);
  },
);

// Extrait un message d'erreur lisible depuis une réponse API.
export function errorMessage(err: unknown, fallback = 'Une erreur est survenue.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; errors?: string[] } | undefined;
    if (data?.message) return data.message;
    if (data?.errors?.length) return data.errors.join(' ');
  }
  return fallback;
}
