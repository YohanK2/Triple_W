import { useEffect, useState } from 'react';
import { Plus, Save, UtensilsCrossed, X } from 'lucide-react';
import { menuService } from '../../services/menuService';
import { useAuth } from '../../context/AuthContext';

const EMPTY = { nombre: '', descripcion: '', precio: '', id_categoria: '', disponible: true };

export default function ProductModal({ isOpen, onClose, onSaved, item = null, categories = [] }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setForm(item
        ? {
            nombre: item.nombre || '',
            descripcion: item.descripcion || '',
            precio: item.precio ?? '',
            id_categoria: item.id_categoria || '',
            disponible: Boolean(item.disponible),
          }
        : EMPTY);
    }
  }, [isOpen, item]);

  if (!isOpen) return null;

  const uid = user?.id_usuario ?? 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.precio || !form.id_categoria) {
      setError('Nombre, precio y categoría son obligatorios');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = {
        id_categoria: Number(form.id_categoria),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio: Number(form.precio),
        imagen: item?.imagen || null,
        disponible: Boolean(form.disponible),
        creado_por: item?.creado_por ?? uid,
        actualizado_por: uid,
      };
      if (item) {
        await menuService.updateItem(item.id_item_menu, body);
        onSaved?.('Producto actualizado');
      } else {
        await menuService.createItem(body);
        onSaved?.('Producto creado exitosamente');
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Error guardando el producto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-container">
        <div className="modal-header">
          <h2>{item ? <><UtensilsCrossed size={20} /> Editar producto</> : <><Plus size={20} /> Nuevo Producto</>}</h2>
          <button className="modal-close" onClick={onClose} type="button"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <label className="modal-label">
            Nombre del producto
            <input
              type="text" name="nombre" placeholder="Ej. Canasta básica familiar"
              value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="modal-input" required
            />
          </label>

          <label className="modal-label">
            Descripción
            <textarea
              name="descripcion" placeholder="Descripción del producto"
              value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="modal-input modal-textarea"
            />
          </label>

          <div className="modal-row">
            <label className="modal-label">
              Precio (COP)
              <input
                type="number" step="1" min="0" name="precio"
                value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })}
                className="modal-input" required
              />
            </label>
            <label className="modal-label">
              Categoría
              <select
                name="id_categoria" value={form.id_categoria}
                onChange={(e) => setForm({ ...form, id_categoria: e.target.value })}
                className="modal-input" required
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="modal-label" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, textTransform: 'none', letterSpacing: 0, fontSize: 12 }}>
            <input
              type="checkbox" checked={form.disponible}
              onChange={(e) => setForm({ ...form, disponible: e.target.checked })}
              style={{ width: 16, height: 16 }}
            />
            Disponible en el menú
          </label>

          {error && <div className="login-error" role="alert" style={{ margin: 0 }}>{error}</div>}

          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="secondary-btn" disabled={saving}>
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
