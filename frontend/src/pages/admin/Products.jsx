import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, UtensilsCrossed, EyeOff, Eye } from 'lucide-react';
import PageIntro from '../../components/common/PageIntro.jsx';
import EmptyPanel from '../../components/common/EmptyPanel.jsx';
import ProductModal from '../../components/common/ProductModal.jsx';
import { useToast } from '../../components/Toast';
import { menuService } from '../../services/menuService';
import { useAuth } from '../../context/AuthContext';
import { formatMoney } from '../../services/format';

export default function Products() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [query, setQuery] = useState('');
  const [catFiltro, setCatFiltro] = useState('todas');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const [it, cats] = await Promise.all([menuService.getItems(), menuService.getCategorias()]);
      setItems(it);
      setCategorias(cats);
    } catch (e) {
      setItems([]);
      showToast(e.message || 'Error cargando productos', 'urgent');
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const catMap = useMemo(() => new Map(categorias.map((c) => [c.id_categoria, c.nombre])), [categorias]);

  const filtrados = useMemo(() => {
    if (!items) return [];
    return items.filter((p) => {
      const okCat = catFiltro === 'todas' || String(p.id_categoria) === String(catFiltro);
      const okQuery = !query.trim()
        || p.nombre.toLowerCase().includes(query.trim().toLowerCase())
        || (catMap.get(p.id_categoria) || '').toLowerCase().includes(query.trim().toLowerCase());
      return okCat && okQuery;
    });
  }, [items, query, catFiltro, catMap]);

  const toggleDisponible = async (item) => {
    try {
      await menuService.updateItem(item.id_item_menu, {
        id_categoria: item.id_categoria,
        nombre: item.nombre,
        descripcion: item.descripcion,
        precio: Number(item.precio),
        imagen: item.imagen,
        disponible: !item.disponible,
        creado_por: item.creado_por ?? user?.id_usuario ?? 1,
        actualizado_por: user?.id_usuario ?? 1,
      });
      showToast(`"${item.nombre}" ${item.disponible ? 'marcado no disponible' : 'marcado disponible'}`, 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error actualizando producto', 'urgent');
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`¿Eliminar "${item.nombre}" del menú?`)) return;
    try {
      await menuService.deleteItem(item.id_item_menu);
      showToast('Producto eliminado', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error eliminando producto', 'urgent');
    }
  };

  return <>
    <PageIntro
      eyebrow="Catálogo"
      title="Productos y menú"
      description="Gestiona categorías, platillos, precios y disponibilidad."
      action={
        <button className="primary-btn" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus size={17}/> Nuevo producto
        </button>
      }
    />
    <div className="toolbar">
      <label className="search-box">
        <Search size={17}/>
        <input placeholder="Buscar producto..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <div className="category-tabs" style={{ marginBottom: 0 }}>
        <button className={catFiltro === 'todas' ? 'active' : ''} onClick={() => setCatFiltro('todas')}>Todas</button>
        {categorias.map((c) => (
          <button key={c.id_categoria} className={catFiltro === String(c.id_categoria) ? 'active' : ''}
            onClick={() => setCatFiltro(String(c.id_categoria))}
          >
            {c.nombre}
          </button>
        ))}
      </div>
    </div>
    <section className="product-grid">
      {items === null ? (
        <EmptyPanel title="Cargando catálogo..." text="Consultando /items_menu." />
      ) : filtrados.length === 0 ? (
        <EmptyPanel title="Catálogo vacío" text="Crea tu primer producto con el botón «Nuevo producto»." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 11, width: '100%' }}>
          {filtrados.map((p) => (
            <article key={p.id_item_menu} className="panel" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <strong style={{ fontSize: 13, lineHeight: 1.3, flex: 1 }}>{p.nombre}</strong>
                <span className={`resv-status ${p.disponible ? 'confirmada' : 'cancelada'}`} style={{ flexShrink: 0 }}>
                  {p.disponible ? 'Disponible' : 'Agotado'}
                </span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{catMap.get(p.id_categoria) || 'Sin categoría'}</span>
              {p.descripcion && <span style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{p.descripcion}</span>}
              <strong style={{ color: 'var(--gold)', fontSize: 14 }}>{formatMoney(Number(p.precio))}</strong>
              <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                <button className="resv-mini-btn" title={p.disponible ? 'Marcar agotado' : 'Marcar disponible'} onClick={() => toggleDisponible(p)} type="button">
                  {p.disponible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button className="resv-mini-btn" title="Editar" onClick={() => { setEditing(p); setModalOpen(true); }} type="button">
                  <Pencil size={14} />
                </button>
                <button className="resv-mini-btn danger" title="Eliminar" onClick={() => remove(p)} type="button">
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>

    <ProductModal
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
      onSaved={(msg) => { showToast(msg, 'success'); load(); }}
      item={editing}
      categories={categorias}
    />

    <div className="visual-note" style={{ marginTop: 16 }}>
      <UtensilsCrossed size={17} /> {items ? `${items.length} productos en el catálogo` : 'Sincronizando catálogo...'}
    </div>
  </>;
}
