# Fernweh Supply Co. — Full-Stack E-Commerce Platform

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&labelColor=20232a)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A full-stack e-commerce platform with user authentication, product management,
shopping cart, and order processing.

**Stack:** React + TypeScript (Vite) · Node.js + Express + TypeScript · PostgreSQL · Docker



## Architecture

```
ecommerce-platform/
├── docker-compose.yml       # orchestrates db + backend + frontend
├── backend/                 # Express REST API
│   ├── db/init.sql          # schema + seed data, run automatically by Postgres on first boot
│   └── src/
│       ├── routes/          # Express routers (thin)
│       ├── controllers/     # request handlers / business logic
│       ├── middleware/      # JWT auth, error handling
│       └── db.ts            # pg Pool
└── frontend/                # React SPA
    └── src/
        ├── api/client.ts    # typed fetch wrapper for the API
        ├── context/         # Auth + Cart React context providers
        └── pages/           # routed views
```

### Data model

- **users** — email/password (bcrypt-hashed), role (`customer` | `admin`)
- **categories**, **products** — catalog with stock tracking
- **carts**, **cart_items** — one open cart per user
- **orders**, **order_items** — created transactionally at checkout; order items
  snapshot the product name/price so historical orders stay accurate even if a
  product is later changed or deactivated

### API overview

| Method | Route                        | Auth        | Description                     |
|--------|-------------------------------|-------------|----------------------------------|
| POST   | `/api/auth/register`          | —           | Create account, returns JWT     |
| POST   | `/api/auth/login`              | —           | Log in, returns JWT             |
| GET    | `/api/auth/me`                 | required    | Current user                    |
| GET    | `/api/products`                | —           | List products (search/category) |
| GET    | `/api/products/:id`            | —           | Product detail                  |
| POST   | `/api/products`                | admin       | Create product                  |
| PATCH  | `/api/products/:id`            | admin       | Update product                  |
| DELETE | `/api/products/:id`            | admin       | Soft-delete product              |
| GET    | `/api/cart`                    | required    | Current user's cart             |
| POST   | `/api/cart/items`              | required    | Add item to cart                |
| PATCH  | `/api/cart/items/:itemId`      | required    | Update quantity (0 removes it)  |
| DELETE | `/api/cart/items/:itemId`      | required    | Remove item                     |
| POST   | `/api/orders/checkout`         | required    | Convert cart into an order      |
| GET    | `/api/orders`                  | required    | Order history                   |
| GET    | `/api/orders/:id`               | required    | Order detail with line items    |

Checkout runs inside a single Postgres transaction: it re-validates stock,
snapshots product data onto the order, decrements inventory, and empties the
cart — all committed together or rolled back on any failure.

## Running it

### With Docker (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api
- Postgres: localhost:5432 (user/pass/db: `ecommerce` / `ecommerce_password` / `ecommerce`)

The database schema and seed products are loaded automatically on first boot
via `backend/db/init.sql`. To reset, run `docker compose down -v` (drops the
volume) then `docker compose up --build` again.

### Locally, without Docker

You'll need Node 20+ and a running Postgres instance.

```bash
# 1. Database
createdb ecommerce
psql ecommerce -f backend/db/init.sql

# 2. Backend
cd backend
cp .env.example .env    # adjust DATABASE_URL if needed
npm install
npm run dev              # http://localhost:4000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

## Deploying to Render

This repo includes a `render.yaml` Blueprint that provisions all three pieces
(Postgres, the API, and the static frontend) in one go.


## Notes / next steps

- Passwords are hashed with bcrypt; auth uses short-lived JWTs sent as
  `Authorization: Bearer <token>`.
- Admin-only routes (`POST/PATCH/DELETE /api/products`) require a user with
  `role = 'admin'` — promote a user directly in Postgres for now
  (`UPDATE users SET role = 'admin' WHERE email = '...'`) since there's no
  admin UI yet.
- No payment gateway is wired up — checkout marks orders `paid` immediately.
  Swapping in Stripe would mean creating a PaymentIntent before the order
  transaction commits.
- CORS is locked to `CORS_ORIGIN` in the backend `.env`.
