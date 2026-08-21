import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function Checkout() {
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { order } = await api.checkout(form);
      await refresh();
      navigate(`/orders?placed=${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="line1">Address line 1</label>
          <input id="line1" value={form.line1} onChange={update('line1')} required />
        </div>
        <div className="field">
          <label htmlFor="line2">Address line 2 (optional)</label>
          <input id="line2" value={form.line2} onChange={update('line2')} />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="city">City</label>
            <input id="city" value={form.city} onChange={update('city')} required />
          </div>
          <div className="field">
            <label htmlFor="state">State</label>
            <input id="state" value={form.state} onChange={update('state')} required />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="postalCode">Postal code</label>
            <input id="postalCode" value={form.postalCode} onChange={update('postalCode')} required />
          </div>
          <div className="field">
            <label htmlFor="country">Country</label>
            <input id="country" value={form.country} onChange={update('country')} required />
          </div>
        </div>

        <div className="cart-summary" style={{ marginBottom: 24 }}>
          <span>Total</span>
          <span>{formatPrice(cart.subtotalCents)}</span>
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={loading || cart.items.length === 0}>
          {loading ? 'Placing order…' : 'Place order'}
        </button>
      </form>
    </div>
  );
}
