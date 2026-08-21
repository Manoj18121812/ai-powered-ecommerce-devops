const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  stock_quantity: number;
  category_id: number | null;
  image_url: string | null;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  name: string;
  price_cents: number;
  stock_quantity: number;
}

export interface CartSummary {
  items: CartItem[];
  subtotalCents: number;
  itemCount: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin';
}

export interface Order {
  id: string;
  status: string;
  total_cents: number;
  currency: string;
  shipping_address: Record<string, string>;
  created_at: string;
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, body.error ?? 'Request failed');
  }

  return body as T;
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    request<{ token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  me: () => request<{ user: AuthUser }>('/auth/me'),

  // Products
  listProducts: (params: { search?: string; category?: string } = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ products: Product[]; total: number }>(`/products${qs ? `?${qs}` : ''}`);
  },
  getProduct: (id: string) => request<{ product: Product }>(`/products/${id}`),

  // Cart
  getCart: () => request<CartSummary>('/cart'),
  addToCart: (productId: string, quantity = 1) =>
    request<CartSummary>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),
  updateCartItem: (itemId: string, quantity: number) =>
    request<CartSummary>(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
  removeCartItem: (itemId: string) =>
    request<CartSummary>(`/cart/items/${itemId}`, { method: 'DELETE' }),

  // Orders
  checkout: (shippingAddress: Record<string, string>) =>
    request<{ order: Order }>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({ shippingAddress }),
    }),
  listOrders: () => request<{ orders: Order[] }>('/orders'),
};

export { ApiError, getToken };
