import { useCallback, useEffect, useState } from 'react';
import { ShoppingCart, Utensils, Flame, X, AlertCircle } from 'lucide-react';
import { menuService, mesasService, ordenesService } from '../services';
import { formatMoney } from '../services/format';
import { FINANCIAL_CONFIG } from '../utils/constants';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';

function cartTotals(cart) {
  const subtotal = cart.reduce((s, i) => s + (Number(i.precio) || 0) * i.quantity, 0);
  const tax = subtotal * (FINANCIAL_CONFIG?.TAX_RATE || 0.16);
  return { subtotal, tax, total: subtotal + tax };
}

export default function NewOrderSection() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [menu, setMenu] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState('all');
  const [cart, setCart] = useState([]);
  const [selectedMesa, setSelectedMesa] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Cargar datos iniciales del Backend FastAPI
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [itemsData, catsData, mesasData] = await Promise.allSettled([
          menuService.getItems(),
          menuService.getCategorias(),
          mesasService.getMesas(),
        ]);

        if (isMounted) {
          if (itemsData.status === 'fulfilled' && Array.isArray(itemsData.value)) {
            setMenu(itemsData.value);
          } else {
            setMenu([]);
          }

          if (catsData.status === 'fulfilled' && Array.isArray(catsData.value)) {
            setCategorias(catsData.value);
          } else {
            setCategorias([]);
          }

          if (mesasData.status === 'fulfilled' && Array.isArray(mesasData.value)) {
            setMesas(mesasData.value);
            if (mesasData.value.length > 0) {
              setSelectedMesa(mesasData.value[0].id_mesa);
            }
          } else {
            setMesas([]);
          }
        }
      } catch (err) {
        console.error('Error al cargar datos del salón:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const addToCart = useCallback(
    (itemId) => {
      const item = (menu || []).find((m) => m.id_item_menu === itemId);
      if (!item) return;

      setCart((prev) => {
        const existing = prev.find((c) => c.id_item_menu === itemId);
        if (existing) {
          return prev.map((c) =>
            c.id_item_menu === itemId ? { ...c, quantity: c.quantity + 1 } : c
          );
        }
        return [
          ...prev,
          {
            id_item_menu: item.id_item_menu,
            nombre: item.nombre,
            precio: parseFloat(item.precio) || 0,
            quantity: 1,
            instrucciones_especiales: '',
          },
        ];
      });
    },
    [menu]
  );

  const changeQty = (itemId, delta) => {
    setCart((prev) => {
      const item = prev.find((c) => c.id_item_menu === itemId);
      if (!item) return prev;
      const nextQty = item.quantity + delta;
      if (nextQty <= 0) return prev.filter((c) => c.id_item_menu !== itemId);
      return prev.map((c) => (c.id_item_menu === itemId ? { ...c, quantity: nextQty } : c));
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((c) => c.id_item_menu !== itemId));
  };

  // Filtrar platillos disponibles de manera segura (evitando null.filter)
  const visibleItems = (menu || []).filter((m) => {
    const isAvailable = Boolean(m.disponible);
    const matchesCategory =
      selectedCategoria === 'all' || String(m.id_categoria) === String(selectedCategoria);
    return isAvailable && matchesCategory;
  });

  const { subtotal, tax, total } = cartTotals(cart);

  // Enviar comanda al Backend
  async function submitOrder() {
    if (cart.length === 0 || !selectedMesa) return;
    setSubmitting(true);

    try {
      // 1. Crear Cabecera de la Orden
      await ordenesService.createOrden({
        id_cliente: null,
        id_mesa: Number(selectedMesa),
        id_mesero: user?.id_usuario || null,
        subtotal,
        impuesto: tax,
        total,
        estado: 'pendiente',
        notas: notes.trim() || null,
      });

      showToast(`¡Orden enviada a cocina con éxito!`, 'success', `Mesa #${selectedMesa}`);
      setCart([]);
      setNotes('');
    } catch (err) {
      showToast(err.message || 'Error al enviar la orden a cocina', 'urgent');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando menú y mesas del restaurante...</p>
      </div>
    );
  }

  return (
    <div className="grid-2" style={{ gridTemplateColumns: '1fr 380px', alignItems: 'start', gap: '1.5rem' }}>
      <div>
        <div className="page-header">
          <div>
            <h1>Toma de Pedidos (POS)</h1>
            <p className="subtitle">Selecciona los platillos para la mesa</p>
          </div>
        </div>

        <div className="card mb-2">
          <div className="card-header">
            <h3>Categorías</h3>
            <div className="tab-nav" style={{ marginBottom: 0, overflowX: 'auto' }}>
              <button
                className={`tab-btn ${selectedCategoria === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategoria('all')}
              >
                Todos
              </button>
              {(categorias || []).map((cat) => (
                <button
                  key={cat.id_categoria}
                  className={`tab-btn ${selectedCategoria === String(cat.id_categoria) ? 'active' : ''}`}
                  onClick={() => setSelectedCategoria(String(cat.id_categoria))}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="card-body">
            {visibleItems.length === 0 ? (
              <EmptyState icon={<Utensils size={22} />} title="No hay platillos disponibles en esta categoría" />
            ) : (
              <div className="menu-grid">
                {visibleItems.map((item) => (
                  <div
                    key={item.id_item_menu}
                    className={`menu-item-card ${cart.find((c) => c.id_item_menu === item.id_item_menu) ? 'selected' : ''}`}
                    onClick={() => addToCart(item.id_item_menu)}
                  >
                    <div className="item-name" style={{ fontWeight: 600 }}>{item.nombre}</div>
                    {item.descripcion && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>
                        {item.descripcion}
                      </p>
                    )}
                    <div className="item-price" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                      {formatMoney(item.precio)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Carrito de la Comanda */}
      <div>
        <div className="card" style={{ position: 'sticky', top: '1rem' }}>
          <div className="card-header">
            <h3 className="h-icon">
              <ShoppingCart size={18} /> Comanda Activa
            </h3>
          </div>

          <div className="card-body">
            <div className="form-group">
              <label>Seleccionar Mesa</label>
              {mesas.length === 0 ? (
                <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>No hay mesas configuradas en la BD</p>
              ) : (
                <select
                  className="form-control"
                  value={selectedMesa}
                  onChange={(e) => setSelectedMesa(e.target.value)}
                >
                  {mesas.map((m) => (
                    <option key={m.id_mesa} value={m.id_mesa}>
                      Mesa #{m.numero_mesa} ({m.ubicacion || 'Salón'} · Cap: {m.capacidad})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ margin: '1rem 0', maxHeight: '300px', overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <div className="icon" style={{ fontSize: '1.5rem' }}>
                    <ShoppingCart size={22} />
                  </div>
                  <p style={{ color: 'var(--text-muted)' }}>Agrega platillos del menú</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id_item_menu}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.nombre}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {formatMoney(item.precio)} c/u
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => changeQty(item.id_item_menu, -1)}>
                        −
                      </button>
                      <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button className="btn btn-ghost btn-sm" onClick={() => changeQty(item.id_item_menu, 1)}>
                        +
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => removeFromCart(item.id_item_menu)}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div style={{ minWidth: 65, textAlign: 'right', fontWeight: 600 }}>
                      {formatMoney(item.precio * item.quantity)}
                    </div>
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
                <span style={{ color: 'var(--text-muted)' }}>IVA (16%)</span>
                <span>{formatMoney(tax)}</span>
              </div>
              <div className="flex-between" style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.5rem' }}>
                <span>Total</span>
                <span style={{ color: 'var(--success)' }}>{formatMoney(total)}</span>
              </div>
            </div>

            <div className="form-group mt-2">
              <label>Notas de la comanda</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. Sin cebolla, término medio..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              disabled={cart.length === 0 || submitting || !selectedMesa}
              onClick={submitOrder}
            >
              <Flame size={16} />
              <span>{submitting ? 'Enviando comanda...' : 'Enviar a Cocina'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}