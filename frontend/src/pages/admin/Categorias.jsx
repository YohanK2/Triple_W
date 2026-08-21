import { useCallback, useEffect, useState } from 'react';
import { Plus, Tag, Pencil, Trash2 } from 'lucide-react';
import PageIntro from '../../components/common/PageIntro.jsx';
import { useToast } from '../../components/Toast';
import { menuService } from '../../services/menuService';
import { useAuth } from '../../context/AuthContext';

export default function Categorias() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [categorias, setCategorias] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cats, its] = await Promise.all([menuService.getCategorias(), menuService.getItems()]);
      setCategorias(cats);
      setItems(its);
    } catch (e) {
      setCategorias([]);
      showToast(e.message || 'Error cargando categorías', 'urgent');
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const uid = user?.id_usuario ?? 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setSaving(true);
    try {
      if (editingId !== null) {
        const cat = categorias.find((c) => c.id_categoria === editingId);
        await menuService.updateCategoria(editingId, {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          activo: cat.activo,
          creado_por: cat.creado_por ?? uid,
          actualizado_por: uid,
        });
        showToast('Categoría actualizada', 'success');
      } else {
        await menuService.createCategoria({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          activo: true,
          creado_por: uid,
          actualizado_por: uid,
        });
        showToast('Categoría creada', 'success');
      }
      setForm({ nombre: '', descripcion: '' });
      setEditingId(null);
      load();
    } catch (err) {
      showToast(err.message || 'Error guardando categoría', 'urgent');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (cat) => {
    setEditingId(cat.id_categoria);
    setForm({ nombre: cat.nombre, descripcion: cat.descripcion || '' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setForm({ nombre: '', descripcion: '' });
  };

  const toggleStatus = async (cat) => {
    try {
      await menuService.updateCategoria(cat.id_categoria, {
        nombre: cat.nombre,
        descripcion: cat.descripcion,
        activo: !cat.activo,
        creado_por: cat.creado_por ?? uid,
        actualizado_por: uid,
      });
      showToast(`Categoría ${cat.activo ? 'desactivada' : 'activada'}`, 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error actualizando categoría', 'urgent');
    }
  };

  const remove = async (cat) => {
    const count = items.filter((i) => i.id_categoria === cat.id_categoria).length;
    if (count > 0) {
      showToast(`No se puede eliminar: ${count} productos usan esta categoría`, 'urgent');
      return;
    }
    if (!window.confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return;
    try {
      await menuService.deleteCategoria(cat.id_categoria);
      showToast('Categoría eliminada', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error eliminando categoría', 'urgent');
    }
  };

  const countFor = (id) => items.filter((i) => i.id_categoria === id).length;

  return (
    <>
      <PageIntro
        eyebrow="Catálogo"
        title="Gestión de Categorías"
        description="Organiza el catálogo por categorías"
      />

      <form className="category-form panel" onSubmit={handleSubmit}>
        <label className="modal-label">
          <span className="label-text">Nombre de categoría</span>
          <input
            type="text" placeholder="Ej. Lácteos"
            value={form.nombre}
            onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
            className="modal-input" required
          />
        </label>
        <label className="modal-label">
          <span className="label-text">Descripción</span>
          <input
            type="text" placeholder="Descripción opcional"
            value={form.descripcion}
            onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
            className="modal-input"
          />
        </label>
        <div className="category-form-actions">
          <button type="submit" className="secondary-btn" disabled={saving}>
            <Plus size={16} />
            {editingId !== null ? (saving ? 'Actualizando...' : 'Actualizar') : (saving ? 'Creando...' : 'Crear categoría')}
          </button>
          {editingId !== null && (
            <button type="button" className="ghost-btn" onClick={cancelEditing}>Cancelar</button>
          )}
        </div>
      </form>

      {categorias === null || categorias.length === 0 ? (
        <div className="panel" style={{ marginTop: 18 }}>
          <div className="empty-panel">
            <div className="empty-icon"><Tag size={24} /></div>
            <h3>{categorias === null ? 'Cargando categorías...' : 'Sin categorías'}</h3>
            <p>{categorias === null ? 'Consultando /categorias_menu.' : 'Crea tu primera categoría usando el formulario de arriba.'}</p>
          </div>
        </div>
      ) : (
        <div className="panel" style={{ marginTop: 18 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Productos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((cat, i) => (
                  <tr key={cat.id_categoria}>
                    <td>{i + 1}</td>
                    <td><strong>{cat.nombre}</strong></td>
                    <td>{cat.descripcion || '—'}</td>
                    <td><span className="category-product-count">{countFor(cat.id_categoria)} productos</span></td>
                    <td>
                      <span className="category-status">
                        <span className={`status-dot ${cat.activo ? 'ok' : 'danger'}`} />
                        {cat.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td>
                      <div className="category-actions">
                        <button className="ghost-btn" onClick={() => startEditing(cat)} type="button">
                          <Pencil size={13} /> Editar
                        </button>
                        <button
                          className={`category-toggle-btn ${cat.activo ? 'deactivate' : 'activate'}`}
                          onClick={() => toggleStatus(cat)} type="button"
                        >
                          <span className={`status-dot ${cat.activo ? 'danger' : 'ok'}`} />
                          {cat.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button className="resv-mini-btn danger" title="Eliminar" onClick={() => remove(cat)} type="button">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
