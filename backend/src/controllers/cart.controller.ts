import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { ApiError } from '../middleware/errorHandler';
import { CartItemRow } from '../types';

const addItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});

const updateItemSchema = z.object({
  quantity: z.number().int().nonnegative(),
});

async function getOrCreateCartId(userId: string): Promise<string> {
  const existing = await query<{ id: string }>('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (existing.rowCount) return existing.rows[0].id;

  const created = await query<{ id: string }>('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [
    userId,
  ]);
  return created.rows[0].id;
}

async function fetchCartItems(cartId: string): Promise<CartItemRow[]> {
  const result = await query<CartItemRow>(
    `SELECT ci.id, ci.cart_id, ci.product_id, ci.quantity, p.name, p.price_cents, p.stock_quantity
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at ASC`,
    [cartId]
  );
  return result.rows;
}

function summarize(items: CartItemRow[]) {
  const subtotalCents = items.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
  return { items, subtotalCents, itemCount: items.reduce((n, i) => n + i.quantity, 0) };
}

export async function getCart(req: Request, res: Response, next: NextFunction) {
  try {
    const cartId = await getOrCreateCartId(req.user!.sub);
    const items = await fetchCartItems(cartId);
    res.json(summarize(items));
  } catch (err) {
    next(err);
  }
}

export async function addItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId, quantity } = addItemSchema.parse(req.body);

    const product = await query<{ id: string; stock_quantity: number }>(
      'SELECT id, stock_quantity FROM products WHERE id = $1 AND is_active = true',
      [productId]
    );
    if (!product.rowCount) throw new ApiError(404, 'Product not found');
    if (product.rows[0].stock_quantity < quantity) throw new ApiError(400, 'Not enough stock available');

    const cartId = await getOrCreateCartId(req.user!.sub);

    await query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
      [cartId, productId, quantity]
    );

    const items = await fetchCartItems(cartId);
    res.status(201).json(summarize(items));
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { quantity } = updateItemSchema.parse(req.body);
    const cartId = await getOrCreateCartId(req.user!.sub);

    if (quantity === 0) {
      await query('DELETE FROM cart_items WHERE cart_id = $1 AND id = $2', [cartId, req.params.itemId]);
    } else {
      const result = await query(
        'UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND id = $3',
        [quantity, cartId, req.params.itemId]
      );
      if (!result.rowCount) throw new ApiError(404, 'Cart item not found');
    }

    const items = await fetchCartItems(cartId);
    res.json(summarize(items));
  } catch (err) {
    next(err);
  }
}

export async function removeItem(req: Request, res: Response, next: NextFunction) {
  try {
    const cartId = await getOrCreateCartId(req.user!.sub);
    await query('DELETE FROM cart_items WHERE cart_id = $1 AND id = $2', [cartId, req.params.itemId]);
    const items = await fetchCartItems(cartId);
    res.json(summarize(items));
  } catch (err) {
    next(err);
  }
}

export async function clearCart(req: Request, res: Response, next: NextFunction) {
  try {
    const cartId = await getOrCreateCartId(req.user!.sub);
    await query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
    res.json(summarize([]));
  } catch (err) {
    next(err);
  }
}
