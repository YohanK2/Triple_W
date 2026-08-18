import { useCallback, useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { api } from '../../api';
import { roleLabel } from '../../utils/format';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';

const ROLE_BADGE = {
  admin: 'badge badge-paid',
  server: 'badge badge-preparing',
  cook: 'badge badge-ready',
};

const EMPTY_FORM = { username: '', name: '', password: '', role: 'server' };

export default function UsersSection() {
  const { showToast } = useToast();
  const [users, setUsers] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      setUsers(await api.getUsers());
    } catch (e) {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createUser(e) {
    e.preventDefault();
    try {
      await api.createUser(form);
      showToast('Usuario creado exitosamente', 'success');
      setModalOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      showToast(err.message || 'Error creando usuario', 'urgent');
    }
  }

  async function toggleUser(id) {
    try {
      await api.toggleUser(id);
      showToast('Usuario actualizado', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error', 'urgent');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p className="subtitle">Administra el personal del restaurante</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm(EMPTY_FORM); setModalOpen(true); }}>+ Nuevo Usuario</button>
      </div>

      <div className="card">
        <div className="card-body table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users !== null && users.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={<Users size={22} />} title="Sin usuarios" description="Crea usuarios para que el personal pueda acceder al sistema." />
                  </td>
                </tr>
              )}
              {users !== null &&
                users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.name}</td>
                    <td><span className={ROLE_BADGE[u.role] || 'badge'}>{roleLabel(u.role)}</span></td>
                    <td>
                      {u.active == 1 ? (
                        <span className="badge badge-ready">Activo</span>
                      ) : (
                        <span className="badge badge-cancelled">Inactivo</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleUser(u.id)}>
                        {u.active == 1 ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <Modal title="Nuevo Usuario" onClose={() => setModalOpen(false)}>
          <form onSubmit={createUser}>
            <div className="form-group">
              <label>Usuario</label>
              <input type="text" className="form-control" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Nombre Completo</label>
              <input type="text" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" className="form-control" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Rol</label>
              <select className="form-control" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="server">Mesero</option>
                <option value="cook">Cocinero</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Crear Usuario</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
