import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Product } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    api.getProduct(id).then(({ product }) => setProduct(product));
  }, [id]);

  if (!product) return <div className="container">Loading…</div>;

  async function handleAddToCart() {
    if (!user) {
      navigate('/login');
      return;
    }
    setError('');
    setAdding(true);
    try {
      await addToCart(product!.id, 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="detail-page">
      <div className="detail-media" />
      <div className="detail-info">
        <div className="product-sku">{product.sku}</div>
        <h1>{product.name}</h1>
        <div className="detail-price">{formatPrice(product.price_cents)}</div>
        <p className="desc">{product.description || 'No description available for this item.'}</p>
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-primary" onClick={handleAddToCart} disabled={adding || product.stock_quantity === 0}>
          {product.stock_quantity === 0 ? 'Out of stock' : adding ? 'Adding…' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}
