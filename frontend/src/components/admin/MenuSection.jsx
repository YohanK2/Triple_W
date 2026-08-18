import { useCallback, useEffect, useState } from 'react';
import { Sandwich } from 'lucide-react';
import { api } from '../../api';
import { formatMoney } from '../../utils/format';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import CategoryBadge from '../../components/CategoryBadge';

const CATEGORIES = [
  ['entrada', 'Entrada'],
  ['plato_fuerte', 'Plato fuerte'],
  ['postre', 'Postre'],
  ['bebida', 'Bebida'],
  ['acompanamiento', 'Acompañamiento'],
];

function readImageAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const EMPTY_FORM = {
  id: null,
  name: '',
  description: '',
  category: 'entrada',
  price: '',
  available: true,
  imageData: null,
};

export default function MenuSection() {
  const { showToast } = useToast();
  const [items, setItems] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      setItems(await api.getMenu());
    } catch (e) {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openModal(item = null) {
    setForm(
      item
        ? {
            id: item.id,
            name: item.name,
            description: item.description || '',
            category: item.category,
            price: item.price,
            available: item.available == 1,
            imageData: null,
          }
        : EMPTY_FORM
    );
    setModalOpen(true);
  }

  async function saveItem(e) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      price: parseFloat(form.price) || 0,
      available: form.available ? 1 : 0,
    };
    if (form.imageData) payload.image_data = form.imageData;

    try {
      if (form.id) {
        await api.updateMenuItem(form.id, payload);
        showToast('Producto actualizado', 'success');
      } else {
        await api.createMenuItem(payload);
        showToast('Producto agregado', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(err.message || 'Error guardando producto', 'urgent');
    }
  }

  async function toggleItem(id) {
    try {
      await api.toggleMenuItem(id);
      showToast('Item actualizado', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error', 'urgent');
    }
  }

  async function deleteItem(id) {
    if (!window.confirm('¿Eliminar este platillo? Esta acción no se puede deshacer.')) return;
    try {
      await api.deleteMenuItem(id);
      showToast('Producto eliminado', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error eliminando producto', 'urgent');
    }
  }

  const itemImg = (item) => item.image_url;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Gestión del Menú</h1>
          <p className="subtitle">Administra los platillos disponibles</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>+ Añadir producto</button>
      </div>

      <div className="card">
        <div className="card-body table-container">
          <table>
            <thead>
              <tr>
                <th>Platillo</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Imagen</th>
                <th>Disponible</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items !== null && items.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={<Sandwich size={22} />} title="Menú vacío" description="Agrega platillos para que los meseros puedan crear órdenes." />
                  </td>
                </tr>
              )}
              {items !== null &&
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        {item.description || 'Sin descripción'}
                      </div>
                    </td>
                    <td><CategoryBadge category={item.category} /></td>
                    <td><strong>{formatMoney(item.price)}</strong></td>
                    <td className="menu-image-cell">
                      {itemImg(item) ? <img src={itemImg(item)} alt={item.name} /> : '—'}
                    </td>
                    <td>
                      {item.available == 1 ? (
                        <span className="badge badge-ready">Sí</span>
                      ) : (
                        <span className="badge badge-cancelled">No</span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <button className="btn btn-ghost btn-sm" onClick={() => openModal(item)}>Editar</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleItem(item.id)}>
                        {item.available == 1 ? 'Desactivar' : 'Activar'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteItem(item.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <Modal
          title={form.id ? 'Editar producto' : 'Nuevo producto'}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={saveItem}>
            <div className="modal-body">
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                className="form-control"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                className="form-control"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                {CATEGORIES.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Precio</label>
              <input
                type="number"
                className="form-control"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Imagen</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) setForm({ ...form, imageData: await readImageAsDataURL(file) });
                }}
              />
              <div className="image-preview">
                {form.imageData ? (
                  <img src={form.imageData} alt="preview" />
                ) : form.id ? (
                  'Mantener imagen actual'
                ) : (
                  'No hay imagen seleccionada'
                )}
              </div>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input type="checkbox" id="menu-item-available" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
              <label htmlFor="menu-item-available" style={{ margin: 0 }}>Disponible</label>
            </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Guardar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}