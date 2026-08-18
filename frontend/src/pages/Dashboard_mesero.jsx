import { useCallback, useEffect, useState } from 'react';
import { ShoppingCart, Utensils, Flame, X } from 'lucide-react';
import { api } from '../../api';
import { formatMoney, TAX_RATE } from '../../utils/format';
import { useToast } from '../../components/Toast';
import EmptyState from '../../components/EmptyState';
import CategoryBadge from '../../components/CategoryBadge';
import { TABLES_COUNT } from '../../config';

const FILTERS = [
  ['all', 'Todos'],
  ['entrada', 'Entradas'],
  ['plato_fuerte', 'Fuertes'],
  ['bebida', 'Bebidas'],
  ['postre', 'Postres'],
];

function cartTotals(cart) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  return { subtotal, tax, total: subtotal + tax };
}

export default function NewOrderSection() {
  const { showToast } = useToast();
  const [menu, setMenu] = useState([]);
  const [filter, setFilter] = useState('all');
  const [cart, setCart] = useState([]);
  const [table, setTable] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .getMenu()
      .then(setMenu)
      .catch(() => setMenu([]));
  }, []);

  const addToCart = useCallback(
    (itemId) => {
      const item = menu.find((m) => m.id === itemId);
      if (!item) return;
      setCart((prev) => {
        const existing = prev.find((c) => c.id === itemId);
        if (existing) {
          return prev.map((c) => (c.id === itemId ? { ...c, quantity: c.quantity + 1 } : c));
        }
        return [...prev, { id: item.id, name: item.name, price: parseFloat(item.price), quantity: 1, special_instructions: '' }];
      });
    },
    [menu]
  );

  const changeQty = (itemId, delta) => {
    setCart((prev) => {
      const item = prev.find((c) => c.id === itemId);
      if (!item) return prev;
      const nextQty = item.quantity + delta;
      if (nextQty <= 0) return prev.filter((c) => c.id !== itemId);
      return prev.map((c) => (c.id === itemId ? { ...c, quantity: nextQty } : c));
    });
  };

  const removeFromCart = (itemId) => setCart((prev) => prev.filter((c) => c.id !== itemId));

  const visibleItems = menu.filter((m) => m.available == 1 && (filter === 'all' || m.category === filter));
  const { subtotal, tax, total } = cartTotals(cart);

  async function submitOrder() {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const result = await api.createOrder({
        table_number: table,
        notes,
        items: cart.map((c) => ({ menu_item_id: c.id, quantity: c.quantity, special_instructions: c.special_instructions })),
      });
      showToast(`Orden #${result.order_id} enviada a cocina`, 'success', `Mesa ${table}`);
      setCart([]);
      setNotes('');
    } catch (err) {
      showToast(err.message || 'Error al crear la orden', 'urgent');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid-2" style={{ gridTemplateColumns: '1fr 380px', alignItems: 'start' }}>
      <div>
        <div className="page-header">
          <div>
            <h1>Nueva Orden</h1>
            <p className="subtitle">Selecciona mesa y platillos</p>
          </div>
        </div>
        <div className="card mb-2">
          <div className="card-header">
            <h3>Menú</h3>
            <div className="tab-nav" style={{ marginBottom: 0 }}>
              {FILTERS.map(([val, label]) => (
                <button key={val} className={`tab-btn ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            {visibleItems.length === 0 ? (
              <EmptyState icon={<Utensils size={22} />} title="Sin items en esta categoría" />
            ) : (
              <div className="menu-grid">
                {visibleItems.map((item) => (
                  <div
                    key={item.id}
                    className={`menu-item-card ${cart.find((c) => c.id === item.id) ? 'selected' : ''}`}
                    onClick={() => addToCart(item.id)}
                  >
                    <div className="item-category"><CategoryBadge category={item.category} size={12} /></div>
                    <div className="item-name">{item.name}</div>
                    <div className="item-price">{formatMoney(item.price)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="card" style={{ position: 'sticky', top: '1rem' }}>
          <div className="card-header">
            <h3 className="h-icon"><ShoppingCart size={18} /> Orden Actual</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Mesa</label>
              <select className="form-control" value={table} onChange={(e) => setTable(Number(e.target.value))}>
                {Array.from({ length: TABLES_COUNT }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>Mesa {n}</option>
                ))}
              </select>
            </div>

            <div style={{ margin: '1rem 0' }}>
              {cart.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <div className="icon" style={{ fontSize: '1.5rem' }}><ShoppingCart size={22} /></div>
                  <p style={{ color: 'var(--text-muted)' }}>Selecciona platillos del menú</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatMoney(item.price)} c/u</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem' }} onClick={() => changeQty(item.id, -1)}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem' }} onClick={() => changeQty(item.id, 1)}>+</button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem', color: 'var(--danger)' }} onClick={() => removeFromCart(item.id)}><X size={14} /></button>
                    </div>
                    <div style={{ minWidth: 60, textAlign: 'right', fontWeight: 600 }}>{formatMoney(item.price * item.quantity)}</div>
                  </div>
                ))
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
              <div className="flex-between" style={{ marginBottom: '0.3rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex-between" style={{ marginBottom: '0.3rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Impuesto (16%)</span>
                <span>{formatMoney(tax)}</span>
              </div>
              <div className="flex-between" style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.5rem' }}>
                <span>Total</span>
                <span style={{ color: 'var(--success)' }}>{formatMoney(total)}</span>
              </div>
            </div>

            <div className="form-group mt-2">
              <label>Notas</label>
              <input type="text" className="form-control" placeholder="Instrucciones especiales..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={cart.length === 0 || submitting} onClick={submitOrder}>
              {submitting ? 'Enviando...' : (<><Flame size={16} /> Enviar a Cocina</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
