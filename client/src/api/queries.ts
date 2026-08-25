import { useQuery } from '@tanstack/react-query';
import {
  adminApi, categoriesApi, gamesApi, ordersApi, productsApi, supportApi, type ProductQuery,
} from './endpoints';

/** Clés de cache centralisées (sert aussi aux invalidations après mutation). */
export const qk = {
  products: (q: ProductQuery) => ['products', q] as const,
  product: (id: number) => ['product', id] as const,
  reviews: (id: number) => ['reviews', id] as const,
  categories: ['categories'] as const,
  brands: ['brands'] as const,
  games: ['games'] as const,
  game: (id: number) => ['game', id] as const,
  build: (id: number, res: string, fps: number) => ['build', id, res, fps] as const,
  adminStats: ['admin', 'stats'] as const,
  myOrders: ['orders', 'mine'] as const,
  allOrders: ['orders', 'all'] as const,
  support: ['support'] as const,
};

export const useProducts = (q: ProductQuery) =>
  useQuery({ queryKey: qk.products(q), queryFn: () => productsApi.list(q) });

export const useProduct = (id: number) =>
  useQuery({ queryKey: qk.product(id), queryFn: () => productsApi.get(id), enabled: !!id });

export const useReviews = (id: number) =>
  useQuery({ queryKey: qk.reviews(id), queryFn: () => productsApi.reviews(id), enabled: !!id });

export const useCategories = () =>
  useQuery({ queryKey: qk.categories, queryFn: categoriesApi.list, staleTime: 5 * 60_000 });

export const useBrands = () =>
  useQuery({ queryKey: qk.brands, queryFn: productsApi.brands, staleTime: 5 * 60_000 });

// La liste des jeux est utilisée par 4 pages → cache long, fetch dédupliqué.
// Les jeux sont importés EN ARRIÈRE-PLAN au boot de l'API (~2-3s, cf. Program.cs) : tant que la
// liste est vide, on re-sonde toutes les 2s pour qu'elle se remplisse toute seule sans refresh
// manuel (sans ça, staleTime=5min garderait une liste vide en cache après l'import).
export const useGames = () =>
  useQuery({
    queryKey: qk.games,
    queryFn: gamesApi.list,
    staleTime: 5 * 60_000,
    refetchInterval: (query) => (query.state.data?.length ? false : 2000),
  });

export const useGameBuild = (id: number | null, res: string, fps: number) =>
  useQuery({
    queryKey: qk.build(id ?? 0, res, fps),
    queryFn: () => gamesApi.build(id!, res, fps),
    enabled: !!id,
  });

export const useAdminStats = () =>
  useQuery({ queryKey: qk.adminStats, queryFn: adminApi.stats });

export const useMyOrders = () =>
  useQuery({ queryKey: qk.myOrders, queryFn: ordersApi.mine });

export const useAllOrders = () =>
  useQuery({ queryKey: qk.allOrders, queryFn: ordersApi.all });

export const useSupportMessages = () =>
  useQuery({ queryKey: qk.support, queryFn: supportApi.all });
