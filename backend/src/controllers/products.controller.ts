import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { ApiError } from '../middleware/errorHandler';
import { Product } from '../types';

const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().nonnegative(),
  stockQuantity: z.number().int().nonnegative(),
  categoryId: z.number().int().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

const updateProductSchema = productSchema.partial();

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, search, page = '1', pageSize = '20' } = req.query as Record<string, string>;

    const conditions: string[] = ['is_active = true'];
    const params: any[] = [];

    if (category) {
      params.push(category);
      conditions.push(`category_id = (SELECT id FROM categories WHERE slug = $${params.length})`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
    const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;

    params.push(limit, offset);

    const result = await query<Product>(
      `SELECT * FROM products
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) FROM products WHERE ${conditions.join(' AND ')}`,
      params.slice(0, params.length - 2)
    );

    res.json({
      products: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page: Number(page),
      pageSize: limit,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query<Product>('SELECT * FROM products WHERE id = $1 AND is_active = true', [
      req.params.id,
    ]);
    const product = result.rows[0];
    if (!product) throw new ApiError(404, 'Product not found');
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const body = productSchema.parse(req.body);
    const result = await query<Product>(
      `INSERT INTO products (sku, name, description, price_cents, stock_quantity, category_id, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        body.sku,
        body.name,
        body.description ?? null,
        body.priceCents,
        body.stockQuantity,
        body.categoryId ?? null,
        body.imageUrl || null,
      ]
    );
    res.status(201).json({ product: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateProductSchema.parse(req.body);
    const fields: string[] = [];
    const params: any[] = [];

    const map: Record<string, any> = {
      sku: body.sku,
      name: body.name,
      description: body.description,
      price_cents: body.priceCents,
      stock_quantity: body.stockQuantity,
      category_id: body.categoryId,
      image_url: body.imageUrl,
    };

    for (const [column, value] of Object.entries(map)) {
      if (value !== undefined) {
        params.push(value);
        fields.push(`${column} = $${params.length}`);
      }
    }

    if (fields.length === 0) throw new ApiError(400, 'No fields to update');

    params.push(req.params.id);
    const result = await query<Product>(
      `UPDATE products SET ${fields.join(', ')}, updated_at = now()
       WHERE id = $${params.length}
       RETURNING *`,
      params
    );

    if (!result.rowCount) throw new ApiError(404, 'Product not found');
    res.json({ product: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    // Soft delete keeps historical order_items referencing the product intact
    const result = await query('UPDATE products SET is_active = false WHERE id = $1', [req.params.id]);
    if (!result.rowCount) throw new ApiError(404, 'Product not found');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
