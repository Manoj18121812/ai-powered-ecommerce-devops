import { useEffect, useState } from 'react';
import { api, Product } from '../api/client';
import { ProductCard } from '../components/ProductCard';

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .listProducts(search ? { search } : {})
      .then(({ products }) => setProducts(products))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-eyebrow">Gear for going further</div>
            <h1>Built for the trail, kept for the long haul.</h1>
            <p>
              Durable outdoor and home goods, made from materials that age well.
              Every piece is stocked, shipped, and tracked through the order below.
            </p>
            <input
              placeholder="Search the catalog..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '11px 14px',
                borderRadius: 3,
                border: 'none',
                width: '100%',
                maxWidth: 320,
                fontSize: 14,
              }}
            />
          </div>
          <dl className="hero-panel">
            <dt>Shipping</dt>
            <dd>Free over $75, dispatched within 2 business days</dd>
            <dt>Returns</dt>
            <dd>30-day window, no questions asked</dd>
            <dt>Warranty</dt>
            <dd>Lifetime repair on hardware and hardware failures</dd>
          </dl>
        </div>
      </section>

      <div className="container">
        <div className="section-heading">
          <h2>The catalog</h2>
        </div>

        {loading ? (
          <p>Loading products…</p>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <h2>Nothing here yet</h2>
            <p>Try a different search term.</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
