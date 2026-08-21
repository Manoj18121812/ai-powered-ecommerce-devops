import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function Cart() {
  const { cart, updateItem, removeItem } = useCart();
  const navigate = useNavigate();

  if (cart.items.length === 0) {
    return (
      <div className="cart-page">
        <h1>Your cart</h1>
        <div className="empty-state">
          <h2>Your cart is empty</h2>
          <p>Browse the catalog to find something for the next trip.</p>
          <div style={{ marginTop: 20 }}>
            <Link to="/" className="btn btn-secondary">
              Back to shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Your cart</h1>
      {cart.items.map((item) => (
        <div className="cart-line" key={item.id}>
          <div>
            <div style={{ fontWeight: 600 }}>{item.name}</div>
            <div className="product-sku">{formatPrice(item.price_cents)} each</div>
          </div>
          <input
            type="number"
            className="qty-input"
            min={0}
            max={item.stock_quantity}
            value={item.quantity}
            onChange={(e) => updateItem(item.id, Math.max(0, Number(e.target.value)))}
          />
          <div style={{ fontFamily: 'var(--font-mono)' }}>{formatPrice(item.price_cents * item.quantity)}</div>
          <button className="btn btn-secondary" onClick={() => removeItem(item.id)}>
            Remove
          </button>
        </div>
      ))}

      <div className="cart-summary">
        <span>Subtotal</span>
        <span>{formatPrice(cart.subtotalCents)}</span>
      </div>

      <button className="btn btn-primary btn-block" style={{ marginTop: 24 }} onClick={() => navigate('/checkout')}>
        Proceed to checkout
      </button>
    </div>
  );
}
