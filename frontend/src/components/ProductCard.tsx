import { Link } from 'react-router-dom';
import { Product } from '../api/client';

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-media">{product.name}</div>
      <div className="product-body">
        <div className="product-sku">{product.sku}</div>
        <div className="product-name">{product.name}</div>
        <span className="price-tag">{formatPrice(product.price_cents)}</span>
      </div>
    </Link>
  );
}
