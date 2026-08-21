import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, UserRound, Trash2 } from 'lucide-react';
import PageIntro from '../../components/common/PageIntro.jsx';
import EmptyPanel from '../../components/common/EmptyPanel.jsx';
import UserModal from '../../components/common/UserModal.jsx';
import { useToast } from '../../components/Toast';
import { usuariosService } from '../../services/usuariosService';
import { useAuth } from '../../context/AuthContext';
import { normalizeRole } from '../../utils/roles';

const ROLE_BADGE = {
  admin: 'resv-status pendiente',
  mesero: 'resv-status preparacion',
  cocinero: 'resv-status lista',
  cajero: 'resv-status confirmada',
};

export default function Users() {
  const { showToast } = useToast();
  const { user: current } = useAuth();
  const [usuarios, setUsuarios] = useState(null);
  const [roles, setRoles] = useState([]);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [us, rs] = await Promise.all([usuariosService.getUsuarios(), usuariosService.getRoles()]);
      setUsuarios(us);
      setRoles(rs);
    } catch (e) {
      setUsuarios([]);
      showToast(e.message || 'Error cargando usuarios', 'urgent');
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const rolMap = useMemo(() => new Map(roles.map((r) => [r.id_rol, r.nombre])), [roles]);

  const filtrados = useMemo(() => {
    if (!usuarios) return [];
    const q = query.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) => u.nombre_usuario.toLowerCase().includes(q)
      || `${u.nombres} ${u.apellidos}`.toLowerCase().includes(q)
      || (u.correo || '').toLowerCase().includes(q));
  }, [usuarios, query]);

  const toggleUser = async (u) => {
    try {
      await usuariosService.updateUsuario(u.id_usuario, {
        nombre_usuario: u.nombre_usuario,
        contrasena: u.contrasena,
        nombres: u.nombres,
        apellidos: u.apellidos,
        correo: u.correo,
        telefono: u.telefono,
        id_rol: u.id_rol,
        activo: !u.activo,
        cargo: u.cargo,
        salario: u.salario,
        fecha_contratacion: u.fecha_contratacion,
        contacto_emergencia: u.contacto_emergencia,
        telefono_emergencia: u.telefono_emergencia,
        estado: !u.activo ? 'activo' : 'inactivo',
        creado_por: u.creado_por ?? current?.id_usuario ?? 1,
        actualizado_por: current?.id_usuario ?? 1,
      });
      showToast(`Usuario ${u.activo ? 'desactivado' : 'activado'}`, 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error actualizando usuario', 'urgent');
    }
  };

  const remove = async (u) => {
    if (u.id_usuario === current?.id_usuario) {
      showToast('No puedes eliminar tu propio usuario', 'urgent');
      return;
    }
    if (!window.confirm(`¿Eliminar al usuario "${u.nombre_usuario}"?`)) return;
    try {
      await usuariosService.deleteUsuario(u.id_usuario);
      showToast('Usuario eliminado', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error eliminando usuario', 'urgent');
    }
  };

  return <>
    <PageIntro
      eyebrow="Administración"
      title="Usuarios y roles"
      description="Gestiona empleados, roles y estado de sus cuentas."
      action={<button className="primary-btn" onClick={() => setModalOpen(true)}><Plus size={17}/> Nuevo usuario</button>}
    />
    <section className="panel">
      <div className="toolbar">
        <label className="search-box">
          <Search size={17}/>
          <input placeholder="Buscar usuario..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>
      {usuarios === null ? (
        <EmptyPanel title="Cargando usuarios..." text="Consultando /usuarios." />
      ) : filtrados.length === 0 ? (
        <EmptyPanel title={query ? 'Sin resultados' : 'Sin usuarios cargados'} text={query ? 'Ningún usuario coincide con la búsqueda.' : 'Crea usuarios con el botón «Nuevo usuario».'} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Usuario</th><th>Nombre</th><th>Cargo</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtrados.map((u) => {
                const role = normalizeRole(rolMap.get(u.id_rol) || u.cargo || '');
                return (
                  <tr key={u.id_usuario}>
                    <td>{u.id_usuario}</td>
                    <td><strong>{u.nombre_usuario}</strong></td>
                    <td>{u.nombres} {u.apellidos}</td>
                    <td><span className={ROLE_BADGE[role] || 'resv-status pendiente'}>{rolMap.get(u.id_rol) || u.cargo || '—'}</span></td>
                    <td>
                      {u.activo ? <span className="resv-status confirmada">Activo</span> : <span className="resv-status cancelada">Inactivo</span>}
                    </td>
                    <td>
                      <div className="category-actions">
                        <button className={`category-toggle-btn ${u.activo ? 'deactivate' : 'activate'}`} onClick={() => toggleUser(u)} type="button">
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button className="resv-mini-btn danger" title="Eliminar" onClick={() => remove(u)} type="button">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>

    <UserModal
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
      onSaved={(msg) => { showToast(msg, 'success'); load(); }}
    />

    <div className="visual-note" style={{ marginTop: 16 }}>
      <UserRound size={17} /> {usuarios ? `${usuarios.filter((u) => u.activo).length} de ${usuarios.length} usuarios activos` : 'Sincronizando usuarios...'}
    </div>
  </>;
}
