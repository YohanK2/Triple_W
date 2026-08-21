import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Trash2, Plus, X } from 'lucide-react';
import PageIntro from '../../components/common/PageIntro.jsx';
import { useToast } from '../../components/Toast';
import { notificacionesService } from '../../services/notificacionesService';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../services/format';

const TIPO_BADGE = {
  info: 'pendiente',
  exito: 'confirmada',
  advertencia: 'preparacion',
  urgente: 'cancelada',
};

export default function Notifications() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ titulo: '', mensaje: '', tipo: 'info' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await notificacionesService.getNotificaciones();
      /* Más recientes primero */
      data.sort((a, b) => b.id_notificacion - a.id_notificacion);
      setNotificaciones(data);
    } catch (e) {
      setNotificaciones([]);
      showToast(e.message || 'Error cargando notificaciones', 'urgent');
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const noLeidas = useMemo(
    () => (notificaciones || []).filter((n) => !n.leida).length,
    [notificaciones],
  );

  const markRead = async (n) => {
    try {
      await notificacionesService.updateNotificacion(n.id_notificacion, {
        id_usuario: n.id_usuario,
        titulo: n.titulo,
        mensaje: n.mensaje,
        tipo: n.tipo,
        leida: true,
      });
      load();
    } catch (err) {
      showToast(err.message || 'Error marcando notificación', 'urgent');
    }
  };

  const markAllRead = async () => {
    const pendientes = (notificaciones || []).filter((n) => !n.leida);
    try {
      await Promise.all(pendientes.map((n) => notificacionesService.updateNotificacion(n.id_notificacion, {
        id_usuario: n.id_usuario,
        titulo: n.titulo,
        mensaje: n.mensaje,
        tipo: n.tipo,
        leida: true,
      })));
      showToast(`${pendientes.length} notificaciones marcadas como leídas`, 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error actualizando notificaciones', 'urgent');
    }
  };

  const remove = async (n) => {
    try {
      await notificacionesService.deleteNotificacion(n.id_notificacion);
      showToast('Notificación eliminada', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error eliminando', 'urgent');
    }
  };

  const create = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.mensaje.trim()) return;
    setSaving(true);
    setError('');
    try {
      await notificacionesService.createNotificacion({
        id_usuario: user?.id_usuario ?? 1,
        titulo: form.titulo.trim(),
        mensaje: form.mensaje.trim(),
        tipo: form.tipo,
        leida: false,
      });
      showToast('Notificación enviada', 'success');
      setModalOpen(false);
      setForm({ titulo: '', mensaje: '', tipo: 'info' });
      load();
    } catch (err) {
      setError(err.message || 'Error creando notificación');
    } finally {
      setSaving(false);
    }
  };

  return <>
    <PageIntro
      eyebrow="Centro de avisos"
      title="Notificaciones"
      description={`Alertas del sistema · ${noLeidas} sin leer`}
      action={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="primary-btn" onClick={() => { setError(''); setModalOpen(true); }}><Plus size={17}/> Nueva alerta</button>
          <button className="ghost-btn" onClick={markAllRead} disabled={noLeidas === 0}><CheckCheck size={17}/> Marcar leídas</button>
        </div>
      }
    />
    <section className="notification-panel">
      {notificaciones === null ? (
        <div className="notification-empty">
          <div className="empty-icon"><Bell size={24} /></div>
          <h3>Cargando notificaciones...</h3>
          <p>Consultando /notificaciones.</p>
        </div>
      ) : notificaciones.length === 0 ? (
        <div className="notification-empty">
          <div className="empty-icon"><Bell size={24} /></div>
          <h3>Sin notificaciones</h3>
          <p>Crea una alerta con el botón «Nueva alerta».</p>
        </div>
      ) : (
        <div className="ord-activity">
          {notificaciones.map((n) => (
            <div key={n.id_notificacion} className="ord-activity-row" style={{ opacity: n.leida ? 0.65 : 1, alignItems: 'flex-start' }}>
              <span className={`resv-status ${TIPO_BADGE[n.tipo] || 'pendiente'}`} style={{ flexShrink: 0 }}>{n.tipo}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', fontSize: 12.5 }}>{n.titulo}</strong>
                <span style={{ display: 'block', color: 'var(--muted)', fontSize: 11, marginTop: 3, lineHeight: 1.5 }}>{n.mensaje}</span>
                <small style={{ color: 'var(--muted)', fontSize: 10, display: 'block', marginTop: 5 }}>
                  {formatDateTime(n.creado_en)} · para usuario #{n.id_usuario} {n.leida ? '· leída' : ''}
                </small>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {!n.leida && (
                  <button className="resv-mini-btn" title="Marcar como leída" onClick={() => markRead(n)} type="button">
                    <CheckCheck size={14} />
                  </button>
                )}
                <button className="resv-mini-btn danger" title="Eliminar" onClick={() => remove(n)} type="button">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>

    {modalOpen && (
      <>
        <div className="modal-overlay" onClick={() => setModalOpen(false)} />
        <div className="modal-container">
          <div className="modal-header">
            <h2><Bell size={20} /> Nueva alerta</h2>
            <button className="modal-close" onClick={() => setModalOpen(false)} type="button"><X size={20} /></button>
          </div>
          <form className="modal-body" onSubmit={create}>
            <label className="modal-label">Título
              <input className="modal-input" required value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej. Stock bajo en tomate" />
            </label>
            <label className="modal-label">Mensaje
              <textarea className="modal-input modal-textarea" required value={form.mensaje}
                onChange={(e) => setForm({ ...form, mensaje: e.target.value })} placeholder="Detalle de la alerta" />
            </label>
            <label className="modal-label">Tipo
              <select className="modal-input" value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="info">Información</option>
                <option value="exito">Éxito</option>
                <option value="advertencia">Advertencia</option>
                <option value="urgente">Urgente</option>
              </select>
            </label>
            {error && <div className="login-error" role="alert" style={{ margin: 0 }}>{error}</div>}
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button type="submit" className="secondary-btn" disabled={saving}>{saving ? 'Enviando...' : 'Enviar'}</button>
            </div>
          </form>
        </div>
      </>
    )}
  </>;
}
