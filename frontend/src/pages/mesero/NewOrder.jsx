import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Minus, Plus, ShoppingCart, Store, Trash2, UtensilsCrossed, Send, StickyNote,
} from 'lucide-react';
import PageIntro from '../../components/common/PageIntro.jsx';
import EmptyPanel from '../../components/common/EmptyPanel.jsx';
import { useToast } from '../../components/Toast';
import { menuService } from '../../services/menuService';
import { mesasService } from '../../services/mesasService';
import { useOrders } from '../../context/ordersCore';
import { formatMoney } from '../../services/format';
import '../../styles/Orders.css';

export default function NewOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { createOrder } = useOrders();

  const [items, setItems] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [cat, setCat] = useState('todas');
  const [cart, setCart] = useState({});
  const [mesaId, setMesaId] = useState(location.state?.mesaId ?? '');
  const [notas, setNotas] = useState('');
  const [sending, setSending] = useState(false);
  const mesaInicial = location.state?.mesaId;

  const load = useCallback(async () => {
    try {
      const [its, cats, ms] = await Promise.all([
        menuService.getItems(),
        menuService.getCategorias(),
        mesasService.getMesas(),
      ]);
      setItems(its.filter((i) => i.disponible));
      setCategorias(cats);
      setMesas(ms.filter((m) => m.activa).sort((a, b) => a.numero_mesa - b.numero_mesa));
      if (mesaInicial) setMesaId(mesaInicial);
    } catch (e) {
      setItems([]);
      showToast(e.message || 'Error cargando el menú', 'urgent');
    }
  }, [showToast, mesaInicial]);

  useEffect(() => {
    load();
  }, [load]);

  const visibles = useMemo(() => {
    if (!items) return [];
    return cat === 'todas' ? items : items.filter((p) => String(p.id_categoria) === String(cat));
  }, [items, cat]);

  const rows = useMemo(
    () => Object.entries(cart)
      .map(([id, cantidad]) => ({ item: items?.find((p) => p.id_item_menu === Number(id)), cantidad }))
      .filter((r) => r.item && r.cantidad > 0),
    [cart, items],
  );

  const subtotal = rows.reduce((s, r) => s + Number(r.item.precio) * r.cantidad, 0);
  const impuesto = Math.round(subtotal * 0.16 * 100) / 100;
  const total = Math.round((subtotal + impuesto) * 100) / 100;

  const add = (id) => setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const dec = (id) => setCart((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
  const remove = (id) => setCart((prev) => ({ ...prev, [id]: 0 }));

  const enviar = async () => {
    if (rows.length === 0 || !mesaId) return;
    setSending(true);
    try {
      const id = await createOrder({
        mesaId: Number(mesaId),
        notas: notas.trim(),
        items: rows.map((r) => ({
          id_item_menu: r.item.id_item_menu,
          nombre: r.item.nombre,
          cantidad: r.cantidad,
          precio: Number(r.item.precio),
        })),
      });
      showToast(`Orden #${id} enviada a cocina`, 'success');
      navigate('/server/ordenes');
    } catch (err) {
      showToast(err.message || 'Error creando la orden', 'urgent');
    } finally {
      setSending(false);
    }
  };

  return <>
    <PageIntro eyebrow="Salón" title="Nueva orden" description="Toma la comanda, selecciona la mesa y envíala a cocina." />

    <div className="order-layout">
      <section className="panel">
        <div className="panel-head">
          <div><h3>Catálogo</h3><p>Selecciona los productos para agregarlos a la comanda.</p></div>
          <UtensilsCrossed size={20} />
        </div>
        <div className="category-tabs">
          <button className={cat === 'todas' ? 'active' : ''} onClick={() => setCat('todas')}>Todas</button>
          {categorias.map((c) => (
            <button key={c.id_categoria} className={cat === String(c.id_categoria) ? 'active' : ''}
              onClick={() => setCat(String(c.id_categoria))}
            >
              {c.nombre}
            </button>
          ))}
        </div>
        {items === null ? (
          <EmptyPanel title="Cargando menú..." text="Consultando /items_menu." />
        ) : visibles.length === 0 ? (
          <EmptyPanel title="Sin productos disponibles" text="Pide al administrador que cargue el catálogo." />
        ) : (
          <div className="no-grid">
            {visibles.map((p) => (
              <button key={p.id_item_menu} type="button" className="no-item" onClick={() => add(p.id_item_menu)}>
                <strong>{p.nombre}</strong>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="no-price">{formatMoney(Number(p.precio))}</span>
                  <span className="no-add"><Plus size={15} /></span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <aside className="panel cart-panel">
        <div className="panel-head"><h3>Orden actual</h3><ShoppingCart size={20} /></div>

        <div className="cart-table-select">
          <span><Store size={14} /> Mesa</span>
          <select
            className="no-mesa" style={{ width: 'auto', paddingLeft: 12, paddingRight: 30 }}
            value={mesaId} onChange={(e) => setMesaId(e.target.value)}
          >
            <option value="" disabled>Seleccionar</option>
            {mesas.map((m) => <option key={m.id_mesa} value={m.id_mesa}>Mesa {m.numero_mesa}</option>)}
          </select>
        </div>

        {rows.length === 0 ? (
          <div className="cart-empty">
            <ShoppingCart size={30} />
            <strong>Carrito vacío</strong>
            <span>Agrega productos del catálogo para armar la comanda.</span>
          </div>
        ) : (
          <div className="no-cart-rows">
            {rows.map(({ item, cantidad }) => (
              <div className="no-cart-row" key={item.id_item_menu}>
                <button type="button" className="qty-btn" onClick={() => dec(item.id_item_menu)} disabled={cantidad <= 1} aria-label="Quitar uno"><Minus size={13} /></button>
                <span className="qty-value">{cantidad}</span>
                <button type="button" className="qty-btn" onClick={() => add(item.id_item_menu)} aria-label="Agregar uno"><Plus size={13} /></button>
                <strong>{item.nombre}</strong>
                <span className="no-line-total">{formatMoney(Number(item.precio) * cantidad)}</span>
                <button type="button" className="no-trash" onClick={() => remove(item.id_item_menu)} aria-label="Eliminar"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}

        <label className="tm-field" style={{ marginTop: 4 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><StickyNote size={13} /> Notas para cocina</span>
          <textarea
            className="modal-input modal-textarea" style={{ textTransform: 'none', letterSpacing: 0 }}
            value={notas} onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej. sin cebolla en una de las hamburguesas"
          />
        </label>

        <div className="cart-summary">
          <div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
          <div><span>Impuesto (16%)</span><strong>{formatMoney(impuesto)}</strong></div>
          <div className="total"><span>Total</span><strong>{formatMoney(total)}</strong></div>
        </div>
        <button className="primary-btn full" onClick={enviar} disabled={rows.length === 0 || !mesaId || sending}>
          <Send size={17} /> {sending ? 'Enviando...' : 'Enviar a cocina'}
        </button>
      </aside>
    </div>
  </>;
}
