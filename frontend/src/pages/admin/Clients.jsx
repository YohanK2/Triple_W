import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Users, Pencil, Trash2, X } from 'lucide-react';
import PageIntro from '../../components/common/PageIntro.jsx';
import EmptyPanel from '../../components/common/EmptyPanel.jsx';
import { useToast } from '../../components/Toast';
import { clientesService } from '../../services/clientesService';
import { useAuth } from '../../context/AuthContext';

const EMPTY = { nombre: '', telefono: '', correo: '', direccion: '', puntos_fidelidad: 0 };

export default function Clients() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [clientes, setClientes] = useState(null);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setClientes(await clientesService.getClientes());
    } catch (e) {
      setClientes([]);
      showToast(e.message || 'Error cargando clientes', 'urgent');
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtrados = useMemo(() => {
    if (!clientes) return [];
    const q = query.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) => c.nombre.toLowerCase().includes(q)
      || (c.correo || '').toLowerCase().includes(q)
      || (c.telefono || '').includes(q));
  }, [clientes, query]);

  const uid = user?.id_usuario ?? 1;

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(''); setModalOpen(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      nombre: c.nombre || '',
      telefono: c.telefono || '',
      correo: c.correo || '',
      direccion: c.direccion || '',
      puntos_fidelidad: c.puntos_fidelidad ?? 0,
    });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setSaving(true);
    setError('');
    try {
      const body = {
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim() || null,
        correo: form.correo.trim() || null,
        direccion: form.direccion.trim() || null,
        puntos_fidelidad: Number(form.puntos_fidelidad) || 0,
        creado_por: editing?.creado_por ?? uid,
        actualizado_por: uid,
      };
      if (editing) {
        await clientesService.updateCliente(editing.id_cliente, body);
        showToast('Cliente actualizado', 'success');
      } else {
        await clientesService.createCliente(body);
        showToast('Cliente creado', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.message || 'Error guardando cliente');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`¿Eliminar al cliente "${c.nombre}"?`)) return;
    try {
      await clientesService.deleteCliente(c.id_cliente);
      showToast('Cliente eliminado', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error eliminando cliente', 'urgent');
    }
  };

  return <>
    <PageIntro
      eyebrow="Relaciones"
      title="Clientes"
      description="Consulta y administra la información de clientes del negocio."
      action={<button className="primary-btn" onClick={openCreate}><Plus size={17}/> Nuevo cliente</button>}
    />
    <section className="panel">
      <div className="toolbar">
        <label className="search-box">
          <Search size={17}/>
          <input placeholder="Buscar cliente..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>
      {clientes === null ? (
        <EmptyPanel title="Cargando clientes..." text="Consultando /clientes." />
      ) : filtrados.length === 0 ? (
        <EmptyPanel title={query ? 'Sin resultados' : 'Sin clientes cargados'} text={query ? 'Ningún cliente coincide con la búsqueda.' : 'Crea el primer cliente con el botón «Nuevo cliente».'} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Teléfono</th><th>Correo</th><th>Dirección</th><th>Puntos</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id_cliente}>
                  <td>{c.id_cliente}</td>
                  <td><strong>{c.nombre}</strong></td>
                  <td>{c.telefono || '—'}</td>
                  <td>{c.correo || '—'}</td>
                  <td>{c.direccion || '—'}</td>
                  <td><span className="category-product-count">{c.puntos_fidelidad} pts</span></td>
                  <td>
                    <div className="category-actions">
                      <button className="resv-mini-btn" title="Editar" onClick={() => openEdit(c)} type="button"><Pencil size={14} /></button>
                      <button className="resv-mini-btn danger" title="Eliminar" onClick={() => remove(c)} type="button"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>

    {modalOpen && (
      <>
        <div className="modal-overlay" onClick={() => setModalOpen(false)} />
        <div className="modal-container">
          <div className="modal-header">
            <h2><Users size={20} /> {editing ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            <button className="modal-close" onClick={() => setModalOpen(false)} type="button"><X size={20} /></button>
          </div>
          <form className="modal-body" onSubmit={handleSubmit}>
            <label className="modal-label">
              Nombre completo
              <input className="modal-input" required value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. María Gómez" />
            </label>
            <div className="modal-row">
              <label className="modal-label">
                Teléfono
                <input className="modal-input" value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="300 123 4567" />
              </label>
              <label className="modal-label">
                Correo
                <input className="modal-input" type="email" value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })} placeholder="cliente@correo.com" />
              </label>
            </div>
            <label className="modal-label">
              Dirección
              <input className="modal-input" value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })} placeholder="Calle 123 #45-67" />
            </label>
            <label className="modal-label">
              Puntos de fidelidad
              <input className="modal-input" type="number" min="0" value={form.puntos_fidelidad}
                onChange={(e) => setForm({ ...form, puntos_fidelidad: e.target.value })} />
            </label>
            {error && <div className="login-error" role="alert" style={{ margin: 0 }}>{error}</div>}
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button type="submit" className="secondary-btn" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      </>
    )}
  </>;
}
