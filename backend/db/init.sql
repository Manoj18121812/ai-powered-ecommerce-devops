-- ==========================================================
-- E-Commerce Platform Schema
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------
-- Users
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- Categories
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) UNIQUE NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL
);

-- ---------------------------------------------------------
-- Products
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku             VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    price_cents     INTEGER NOT NULL CHECK (price_cents >= 0),
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    stock_quantity  INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    image_url       VARCHAR(500),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- ---------------------------------------------------------
-- Cart (one open cart per user)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS carts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id         UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (cart_id, product_id)
);

-- ---------------------------------------------------------
-- Orders
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    total_cents         INTEGER NOT NULL CHECK (total_cents >= 0),
    currency            VARCHAR(3) NOT NULL DEFAULT 'USD',
    shipping_address    JSONB NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name        VARCHAR(255) NOT NULL,   -- snapshot at purchase time
    unit_price_cents    INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    quantity            INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ---------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------
INSERT INTO categories (name, slug) VALUES
    ('Outdoor', 'outdoor'),
    ('Home & Kitchen', 'home-kitchen'),
    ('Apparel', 'apparel')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (sku, name, description, price_cents, stock_quantity, category_id, image_url)
VALUES
    ('OUT-001', 'Trailhead Backpack 32L', 'Weatherproof daypack with padded straps.', 8900, 42, 1, ''),
    ('OUT-002', 'Insulated Steel Bottle', 'Keeps drinks cold for 24h, hot for 12h.', 2400, 120, 1, ''),
    ('HOM-001', 'Cast Iron Skillet 10"', 'Pre-seasoned, oven safe to 500F.', 3500, 65, 2, ''),
    ('HOM-002', 'Ceramic Pour-Over Set', 'Matte glaze dripper and carafe.', 4200, 30, 2, ''),
    ('APP-001', 'Merino Wool Beanie', 'Lightweight, moisture-wicking knit.', 1800, 200, 3, ''),
    ('APP-002', 'Waxed Canvas Field Jacket', 'Rugged shell for cold-weather trips.', 12800, 18, 3, '')
ON CONFLICT (sku) DO NOTHING;
