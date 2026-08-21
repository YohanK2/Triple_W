import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, UserRoundPen, UserRound, Phone, Mail, Lock, Eye, EyeOff,
  Briefcase, ChevronDown, HeartPulse,
} from 'lucide-react';
import { usuariosService } from '../../services/usuariosService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/UserModal.css';

export default function EditUserModal({ usuario, roles = [], isOpen, onClose, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !usuario) return undefined;
    setForm({
      nombres: usuario.nombres ?? '',
      apellidos: usuario.apellidos ?? '',
      telefono: usuario.telefono ?? '',
      correo: usuario.correo ?? '',
      id_rol: String(usuario.id_rol ?? ''),
      password: '',
      contactoEmergencia: usuario.contacto_emergencia ?? '',
      telefonoEmergencia: usuario.telefono_emergencia ?? '',
    });
    setShowPassword(false);
    setError('');
    return undefined;
  }, [isOpen, usuario]);

  if (!usuario) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => onClose();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombres.trim() || !form.apellidos.trim() || !form.telefono.trim()
      || !form.correo.trim() || !form.id_rol) {
      setError('Completa todos los campos obligatorios');
      return;
    }
    if (form.password && form.password.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const rol = roles.find((r) => String(r.id_rol) === form.id_rol);
      const uid = user?.id_usuario ?? 1;
      await usuariosService.updateUsuario(usuario.id_usuario, {
        nombre_usuario: usuario.nombre_usuario,
        contrasena: form.password || usuario.contrasena,
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim(),
        id_rol: Number(form.id_rol),
        activo: usuario.activo,
        cargo: rol?.nombre || usuario.cargo,
        salario: usuario.salario,
        fecha_contratacion: usuario.fecha_contratacion,
        contacto_emergencia: form.contactoEmergencia.trim() || null,
        telefono_emergencia: form.telefonoEmergencia.trim() || null,
        estado: usuario.estado,
        creado_por: usuario.creado_por ?? uid,
        actualizado_por: uid,
      });
      onSaved?.(`Usuario "${usuario.nombre_usuario}" actualizado correctamente`);
    } catch (err) {
      setError(err.message || 'Error actualizando usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && form && (
        <>
          <motion.div
            className="um-overlay" onClick={handleClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          <div className="um-wrapper">
            <motion.div
              className="um-container" role="dialog" aria-modal="true"
              initial={{ opacity: 0, scale: 0.88, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            >
              <div className="um-header">
                <div className="um-header-top">
                  <div className="um-avatar"><UserRoundPen size={24} /></div>
                  <div className="um-title">
                    <h2>Editar usuario</h2>
                    <p>Modifica los datos de {usuario.nombre_usuario}</p>
                  </div>
                  <button type="button" className="um-close" onClick={handleClose} aria-label="Cerrar">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="um-body">
                <div className="um-grid">
                  <div className="um-field" style={{ gridColumn: '1 / -1' }}>
                    Nombre de usuario
                    <div className="um-input-wrap">
                      <UserRound size={15} className="um-lead" />
                      <input type="text" className="um-input" value={usuario.nombre_usuario} disabled />
                    </div>
                  </div>

                  <div className="um-field">
                    Nombre
                    <div className="um-input-wrap">
                      <UserRound size={15} className="um-lead" />
                      <input type="text" name="nombres" className="um-input" placeholder="Ej. Laura"
                        value={form.nombres} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="um-field">
                    Apellido
                    <div className="um-input-wrap">
                      <UserRound size={15} className="um-lead" />
                      <input type="text" name="apellidos" className="um-input" placeholder="Ej. Rodríguez"
                        value={form.apellidos} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="um-field">
                    Teléfono
                    <div className="um-input-wrap">
                      <Phone size={15} className="um-lead" />
                      <input type="tel" name="telefono" className="um-input" placeholder="Ej. 300 123 4567"
                        value={form.telefono} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="um-field">
                    Correo electrónico
                    <div className="um-input-wrap">
                      <Mail size={15} className="um-lead" />
                      <input type="email" name="correo" className="um-input" placeholder="nombre@correo.com"
                        value={form.correo} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="um-field">
                    Nueva contraseña
                    <div className="um-input-wrap">
                      <Lock size={15} className="um-lead" />
                      <input
                        type={showPassword ? 'text' : 'password'} name="password" className="um-input"
                        placeholder="Sin cambios (dejar vacía)" style={{ paddingRight: '44px' }}
                        value={form.password} onChange={handleChange} minLength={6}
                      />
                      <button type="button" className="um-toggle-pass" aria-label="Mostrar contraseña"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="um-field">
                    Rol
                    <div className="um-input-wrap">
                      <Briefcase size={15} className="um-lead" />
                      <select name="id_rol" className="um-input um-select" value={form.id_rol}
                        onChange={handleChange} required
                      >
                        <option value="" disabled>Seleccionar rol</option>
                        {roles.map((r) => (
                          <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="um-select-arrow" />
                    </div>
                  </div>

                  <div className="um-field">
                    Contacto de emergencia
                    <div className="um-input-wrap">
                      <HeartPulse size={15} className="um-lead" />
                      <input type="text" name="contactoEmergencia" className="um-input" placeholder="Ej. María Gómez"
                        value={form.contactoEmergencia} onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="um-field">
                    Teléfono de emergencia
                    <div className="um-input-wrap">
                      <Phone size={15} className="um-lead" />
                      <input type="tel" name="telefonoEmergencia" className="um-input" placeholder="Teléfono de emergencia"
                        value={form.telefonoEmergencia} onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {error && <div className="login-error" role="alert" style={{ margin: 0 }}>{error}</div>}

                <div className="um-actions">
                  <button type="button" className="ghost-btn" onClick={handleClose}>Cancelar</button>
                  <button type="submit" className="primary-btn" disabled={saving}>
                    <UserRoundPen size={15} /> {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
