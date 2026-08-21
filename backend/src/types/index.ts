export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'customer' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin';
}

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
  is_active: boolean;
}

export interface CartItemRow {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  name: string;
  price_cents: number;
  stock_quantity: number;
}

export interface AuthTokenPayload {
  sub: string; // user id
  role: 'customer' | 'admin';
}

// Augment Express Request with the authenticated user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}
