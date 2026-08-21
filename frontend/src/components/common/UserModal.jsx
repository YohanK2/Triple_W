import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, UserRoundPlus, UserRound, Phone, Mail, Lock, Eye, EyeOff,
  Sparkles, ChevronRight, ArrowLeft, HeartPulse, Briefcase, ChevronDown,
} from 'lucide-react';
import { usuariosService } from '../../services/usuariosService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/UserModal.css';

const INITIAL_FORM = {
  nombres: '',
  apellidos: '',
  telefono: '',
  correo: '',
  password: '',
  cargo: '',
  telefonoOpcional: '',
  contactoEmergencia: '',
};

const fieldItem = {
  enter: { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const stepVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 70 : -70 }),
  center: { opacity: 1, x: 0, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -70 : 70 }),
};

function slugify(text) {
  return String(text)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
}

export default function UserModal({ isOpen, onClose, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    usuariosService.getRoles()
      .then(setRoles)
      .catch(() => setRoles([]));
    return undefined;
  }, [isOpen]);

  const reset = () => {
    setForm(INITIAL_FORM);
    setStep(0);
    setShowPassword(false);
    setError('');
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const goToOptional = () => { setDirection(1); setStep(1); };
  const goBack = () => { setDirection(-1); setStep(0); };

  const generateUsername = (nombres, apellidos, existing) => {
    const base = slugify(`${nombres}.${apellidos}`) || 'usuario';
    let candidate = base;
    let i = 1;
    while (existing.some((u) => u.nombre_usuario === candidate)) {
      candidate = `${base}${i}`;
      i += 1;
    }
    return candidate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombres.trim() || !form.apellidos.trim() || !form.telefono.trim()
      || !form.correo.trim() || !form.password || !form.cargo) {
      setDirection(-1);
      setStep(0);
      setError('Completa todos los campos obligatorios');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const rol = roles.find((r) => String(r.id_rol) === String(form.cargo));
      const usuarios = await usuariosService.getUsuarios();
      const nombreUsuario = generateUsername(form.nombres, form.apellidos, usuarios);
      const uid = user?.id_usuario ?? 1;
      await usuariosService.createUsuario({
        nombre_usuario: nombreUsuario,
        contrasena: form.password,
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim(),
        id_rol: Number(form.cargo),
        activo: true,
        cargo: rol?.nombre || 'Empleado',
        salario: 0,
        fecha_contratacion: new Date().toISOString().slice(0, 10),
        contacto_emergencia: form.contactoEmergencia.trim() || null,
        telefono_emergencia: form.telefonoOpcional.trim() || null,
        estado: 'activo',
        creado_por: uid,
        actualizado_por: uid,
      });
      onSaved?.(`Usuario "${nombreUsuario}" creado exitosamente`);
      onClose();
      setTimeout(reset, 300);
    } catch (err) {
      setError(err.message || 'Error creando usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
                  <div className="um-avatar"><UserRoundPlus size={24} /></div>
                  <div className="um-title">
                    <h2>Nuevo usuario</h2>
                    <p>Registra a un nuevo miembro del equipo</p>
                  </div>
                  <button type="button" className="um-close" onClick={handleClose} aria-label="Cerrar">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="um-steps">
                <div className={`um-step ${step === 0 ? 'active' : 'done'}`}>
                  <span className="um-step-num">1</span>
                  <span>Datos principales</span>
                </div>
                <div className="um-track">
                  <motion.div
                    className="um-fill" initial={false}
                    animate={{ scaleX: step }}
                    transition={{ type: 'spring', stiffness: 200, damping: 26 }}
                  />
                </div>
                <div className={`um-step ${step === 1 ? 'active' : ''}`}>
                  <span className="um-step-num">2</span>
                  <span>Datos opcionales</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="um-body">
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                  {step === 0 ? (
                    <motion.div
                      key="principales" className="um-grid" custom={direction}
                      variants={stepVariants} initial="enter" animate="center" exit="exit"
                      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    >
                      <motion.div className="um-field" variants={fieldItem}>
                        Nombre
                        <div className="um-input-wrap">
                          <UserRound size={15} className="um-lead" />
                          <input type="text" name="nombres" className="um-input" placeholder="Ej. Laura"
                            value={form.nombres} onChange={handleChange} required />
                        </div>
                      </motion.div>

                      <motion.div className="um-field" variants={fieldItem}>
                        Apellido
                        <div className="um-input-wrap">
                          <UserRound size={15} className="um-lead" />
                          <input type="text" name="apellidos" className="um-input" placeholder="Ej. Rodríguez"
                            value={form.apellidos} onChange={handleChange} required />
                        </div>
                      </motion.div>

                      <motion.div className="um-field" variants={fieldItem}>
                        Teléfono
                        <div className="um-input-wrap">
                          <Phone size={15} className="um-lead" />
                          <input type="tel" name="telefono" className="um-input" placeholder="Ej. 300 123 4567"
                            value={form.telefono} onChange={handleChange} required />
                        </div>
                      </motion.div>

                      <motion.div className="um-field" variants={fieldItem}>
                        Correo electrónico
                        <div className="um-input-wrap">
                          <Mail size={15} className="um-lead" />
                          <input type="email" name="correo" className="um-input" placeholder="nombre@correo.com"
                            value={form.correo} onChange={handleChange} required />
                        </div>
                      </motion.div>

                      <motion.div className="um-field" variants={fieldItem}>
                        Contraseña
                        <div className="um-input-wrap">
                          <Lock size={15} className="um-lead" />
                          <input
                            type={showPassword ? 'text' : 'password'} name="password" className="um-input"
                            placeholder="Mínimo 6 caracteres" style={{ paddingRight: '44px' }}
                            value={form.password} onChange={handleChange} required minLength={6}
                          />
                          <button type="button" className="um-toggle-pass" aria-label="Mostrar contraseña"
                            onClick={() => setShowPassword((v) => !v)}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </motion.div>

                      <motion.div className="um-field" variants={fieldItem}>
                        Cargo
                        <div className="um-input-wrap">
                          <Briefcase size={15} className="um-lead" />
                          <select name="cargo" className="um-input um-select" value={form.cargo}
                            onChange={handleChange} required
                          >
                            <option value="" disabled>Seleccionar cargo</option>
                            {roles.map((r) => (
                              <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>
                            ))}
                          </select>
                          <ChevronDown size={15} className="um-select-arrow" />
                        </div>
                      </motion.div>

                      <motion.button
                        type="button" className="um-optional-btn" onClick={goToOptional}
                        variants={fieldItem} whileTap={{ scale: 0.98 }}
                        style={{ gridColumn: '1 / -1' }}
                      >
                        <Sparkles size={17} color="var(--gold)" />
                        <span className="um-optional-text">
                          <strong>Datos opcionales</strong>
                          <small>Teléfono y contacto de emergencia</small>
                        </span>
                        <ChevronRight size={17} />
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="opcionales" className="um-grid" custom={direction}
                      variants={stepVariants} initial="enter" animate="center" exit="exit"
                      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    >
                      <motion.div className="um-optional-note" variants={fieldItem} style={{ gridColumn: '1 / -1' }}>
                        <HeartPulse size={15} color="var(--gold)" />
                        Esta información es opcional, pero ayuda a contactar a alguien en caso de emergencia.
                      </motion.div>

                      <motion.div className="um-field" variants={fieldItem}>
                        Teléfono
                        <div className="um-input-wrap">
                          <Phone size={15} className="um-lead" />
                          <input type="tel" name="telefonoOpcional" className="um-input" placeholder="Teléfono de emergencia"
                            value={form.telefonoOpcional} onChange={handleChange}
                          />
                        </div>
                      </motion.div>

                      <motion.div className="um-field" variants={fieldItem}>
                        Contacto de emergencia
                        <div className="um-input-wrap">
                          <HeartPulse size={15} className="um-lead" />
                          <input type="text" name="contactoEmergencia" className="um-input" placeholder="Ej. María Gómez"
                            value={form.contactoEmergencia} onChange={handleChange}
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && <div className="login-error" role="alert" style={{ margin: 0 }}>{error}</div>}

                <div className="um-actions">
                  {step === 1 && (
                    <button type="button" className="ghost-btn back-btn" onClick={goBack}>
                      <ArrowLeft size={15} /> Volver
                    </button>
                  )}
                  <button type="button" className="ghost-btn" onClick={handleClose}>Cancelar</button>
                  <button type="submit" className="primary-btn" disabled={saving}>
                    <UserRoundPlus size={15} /> {saving ? 'Creando...' : 'Crear usuario'}
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
