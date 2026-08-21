import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool, query } from '../db';
import { ApiError } from '../middleware/errorHandler';

const checkoutSchema = z.object({
  shippingAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
  }),
});

// Creates an order from the user's current cart inside a single DB transaction:
// re-validates stock, snapshots product name/price, decrements inventory, empties the cart.
export async function checkout(req: Request, res: Response, next: NextFunction) {
  const client = await pool.connect();
  try {
    const { shippingAddress } = checkoutSchema.parse(req.body);
    const userId = req.user!.sub;

    await client.query('BEGIN');

    const cartResult = await client.query('SELECT id FROM carts WHERE user_id = $1 FOR UPDATE', [userId]);
    if (!cartResult.rowCount) throw new ApiError(400, 'Cart is empty');
    const cartId = cartResult.rows[0].id;

    const itemsResult = await client.query(
      `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price_cents, p.stock_quantity
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1
       FOR UPDATE OF p`,
      [cartId]
    );

    if (!itemsResult.rowCount) throw new ApiError(400, 'Cart is empty');

    for (const item of itemsResult.rows) {
      if (item.stock_quantity < item.quantity) {
        throw new ApiError(400, `Not enough stock for "${item.name}"`);
      }
    }

    const totalCents = itemsResult.rows.reduce(
      (sum, item) => sum + item.price_cents * item.quantity,
      0
    );

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, status, total_cents, shipping_address)
       VALUES ($1, 'paid', $2, $3)
       RETURNING *`,
      [userId, totalCents, shippingAddress]
    );
    const order = orderResult.rows[0];

    for (const item of itemsResult.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price_cents, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.product_id, item.name, item.price_cents, item.quantity]
      );
      await client.query('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2', [
        item.quantity,
        item.product_id,
      ]);
    }

    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    await client.query('COMMIT');

    res.status(201).json({ order });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

export async function listOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user!.sub]
    );
    res.json({ orders: orders.rows });
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const orderResult = await query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user!.sub,
    ]);
    const order = orderResult.rows[0];
    if (!order) throw new ApiError(404, 'Order not found');

    const items = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    res.json({ order, items: items.rows });
  } catch (err) {
    next(err);
  }
}
