import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, Order } from '../api/client';

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const justPlaced = searchParams.get('placed');

  useEffect(() => {
    api
      .listOrders()
      .then(({ orders }) => setOrders(orders))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="orders-page">
      <h1>Your orders</h1>
      {justPlaced && (
        <div className="form-error" style={{ background: '#eaf2ea', borderColor: '#1f3a2d', color: '#1f3a2d' }}>
          Order placed successfully.
        </div>
      )}
      {loading ? (
        <p>Loading…</p>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h2>No orders yet</h2>
          <p>Once you check out, your orders will show up here.</p>
        </div>
      ) : (
        orders.map((order) => (
          <div className="order-card" key={order.id}>
            <div className="order-card-header">
              <span>#{order.id.slice(0, 8)}</span>
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="status-pill">{order.status}</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatPrice(order.total_cents)}</strong>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
