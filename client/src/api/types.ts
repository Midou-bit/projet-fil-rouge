export interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  stock: number;
  imageUrl?: string;
  description: string;
  perfScore: number;
  specs?: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  averageRating: number;
  reviewCount: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  productCount: number;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  stock: number;
  lineTotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface OrderItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  customerEmail?: string;
  items: OrderItem[];
}

export interface GameRequirement {
  id: number;
  resolution: string;
  targetFps: number;
  minGpuScore: number;
  recoGpuScore: number;
  minCpuScore: number;
  recoCpuScore: number;
  minRamGb: number;
}

export interface Game {
  id: number;
  title: string;
  imageUrl?: string;
  releaseYear: number;
  genre?: string | null;
  metacritic?: number | null;
  requirements: GameRequirement[];
}

export interface ScoreSummary {
  estimatedFps: number;
  gamingPerformance: number;
  cpuPower: number;
  visualQuality: string;
  bottleneckPenalty: number;
  priceValue: number;
  meetsMinimum: boolean;
  meetsRecommended: boolean;
  verdict: string;
}

export interface BuildRecommendation {
  game: Game;
  resolution: string;
  targetFps: number;
  parts: Product[];
  totalPrice: number;
  score: ScoreSummary;
}

export interface CheckResult {
  gameTitle: string;
  resolution: string;
  targetFps: number;
  score: ScoreSummary;
  suggestedGpuUpgrade?: Product | null;
  suggestedCpuUpgrade?: Product | null;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  author: string;
  createdAt: string;
}

export interface SupportMessage {
  id: number;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  revenue: number;
  pendingSupport: number;
  topProducts: { name: string; quantitySold: number; revenue: number }[];
}

export interface AuthResponse {
  token: string;
  email: string;
  role: string;
}

export interface AccountExportItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface AccountExport {
  exportedAtUtc: string;
  account: { email: string; createdAt: string; roles: string[] };
  cart: { items: AccountExportItem[]; total: number };
  orders: Array<{
    id: number;
    totalPrice: number;
    status: string;
    createdAt: string;
    items: AccountExportItem[];
  }>;
  reviews: Array<{
    id: number;
    productId: number;
    productName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
  supportMessages: Array<{
    id: number;
    email: string;
    subject: string;
    message: string;
    status: string;
    createdAt: string;
  }>;
}
