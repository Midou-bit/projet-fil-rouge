import { api } from './client';
import type {
  AccountExport, AdminStats, AuthResponse, BuildRecommendation, Cart, Category, CheckResult,
  Game, Order, Paged, Product, Review, ScoreSummary, SupportMessage,
} from './types';

// --- Auth ---
export const authApi = {
  register: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { email, password }).then((r) => r.data),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
};

// --- Compte (RGPD) ---
export const accountApi = {
  exportData: () => api.get<AccountExport>('/account/export').then((r) => r.data),
  remove: () => api.delete('/account').then((r) => r.data),
};

// --- Catalogue ---
export interface ProductQuery {
  search?: string; category?: string; brand?: string;
  minPrice?: number; maxPrice?: number; minPerf?: number;
  sort?: string; page?: number; pageSize?: number;
}
export const productsApi = {
  list: (q: ProductQuery = {}) =>
    api.get<Paged<Product>>('/products', { params: q }).then((r) => r.data),
  get: (id: number) => api.get<Product>(`/products/${id}`).then((r) => r.data),
  brands: () => api.get<string[]>('/products/brands').then((r) => r.data),
  reviews: (id: number) => api.get<Review[]>(`/products/${id}/reviews`).then((r) => r.data),
  create: (body: Partial<Product>) => api.post<Product>('/products', body).then((r) => r.data),
  update: (id: number, body: Partial<Product>) =>
    api.put<Product>(`/products/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/products/${id}`),
};

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories').then((r) => r.data),
  create: (body: { name: string; slug: string }) =>
    api.post<Category>('/categories', body).then((r) => r.data),
  update: (id: number, body: { name: string; slug: string }) =>
    api.put<Category>(`/categories/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/categories/${id}`),
};

// --- Panier ---
export const cartApi = {
  get: () => api.get<Cart>('/cart').then((r) => r.data),
  add: (productId: number, quantity = 1) =>
    api.post<Cart>('/cart/items', { productId, quantity }).then((r) => r.data),
  update: (id: number, quantity: number) =>
    api.put<Cart>(`/cart/items/${id}`, { quantity }).then((r) => r.data),
  remove: (id: number) => api.delete<Cart>(`/cart/items/${id}`).then((r) => r.data),
  clear: () => api.delete<Cart>('/cart').then((r) => r.data),
};

// --- Checkout / commandes ---
export const checkoutApi = {
  create: () =>
    api.post<{ checkoutUrl?: string; orderId: number; paymentMode: 'simulation' | 'stripe_test' }>('/checkout')
      .then((r) => r.data),
  confirm: (orderId: number) =>
    api.post<{ status: 'Paid' | 'Shipped'; paymentMode: 'simulation' | 'stripe_test' }>(`/checkout/confirm/${orderId}`).then((r) => r.data),
};
export const ordersApi = {
  mine: () => api.get<Order[]>('/orders').then((r) => r.data),
  all: () => api.get<Order[]>('/admin/orders').then((r) => r.data),
  setStatus: (id: number, status: string) =>
    api.put<{ status: string }>(`/admin/orders/${id}/status`, { status }).then((r) => r.data),
  cancel: (id: number) => api.post<Order>(`/orders/${id}/cancel`).then((r) => r.data),
};

// --- Jeux / moteur ---
export const gamesApi = {
  list: () => api.get<Game[]>('/games').then((r) => r.data),
  get: (id: number) => api.get<Game>(`/games/${id}`).then((r) => r.data),
  build: (id: number, resolution: string, fps: number) =>
    api.get<BuildRecommendation>(`/games/${id}/build`, { params: { resolution, fps } })
      .then((r) => r.data),
};
export const engineApi = {
  check: (body: { cpuId: number; gpuId: number; gameId: number; resolution: string; targetFps: number; ramGb: number }) =>
    api.post<CheckResult>('/check', body).then((r) => r.data),
  calc: (body: { productIds: number[]; gameId?: number | null; resolution: string; targetFps: number }) =>
    api.post<ScoreSummary>('/build/calc', body).then((r) => r.data),
};

// --- Reviews / support / admin ---
export const reviewsApi = {
  create: (productId: number, rating: number, comment: string) =>
    api.post<Review>('/reviews', { productId, rating, comment }).then((r) => r.data),
};
export const supportApi = {
  send: (email: string, subject: string, message: string) =>
    api.post('/support', { email, subject, message }).then((r) => r.data),
  all: () => api.get<SupportMessage[]>('/admin/support').then((r) => r.data),
  markAnswered: (id: number) =>
    api.put<{ status: string }>(`/admin/support/${id}/answered`).then((r) => r.data),
};
export const adminApi = {
  stats: () => api.get<AdminStats>('/admin/stats').then((r) => r.data),
};
