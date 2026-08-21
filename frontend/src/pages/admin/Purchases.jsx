import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardPlus, Plus, Truck, Pencil, Trash2, X } from 'lucide-react';
import PageIntro from '../../components/common/PageIntro.jsx';
import EmptyPanel from '../../components/common/EmptyPanel.jsx';
import { useToast } from '../../components/Toast';
import { proveedoresService } from '../../services/proveedoresService';
import { useAuth } from '../../context/AuthContext';
import { formatMoney, formatDateTime } from '../../services/format';

const EMPTY_PROV = { empresa: '', contacto: '', telefono: '', correo: '', direccion: '', activo: true };
const OC_ESTADOS = { pendiente: 'pendiente', aprobada: 'confirmada', recibida: 'lista', cancelada: 'cancelada' };

export default function Purchases() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [proveedores, setProveedores] = useState(null);
  const [ordenesCompra, setOrdenesCompra] = useState(null);
  const [provModal, setProvModal] = useState(false);
  const [editingProv, setEditingProv] = useState(null);
  const [provForm, setProvForm] = useState(EMPTY_PROV);
  const [ocModal, setOcModal] = useState(false);
  const [ocForm, setOcForm] = useState({ id_proveedor: '', total: '', estado: 'pendiente' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [p, oc] = await Promise.all([
        proveedoresService.getProveedores(),
        proveedoresService.getOrdenesCompra().catch(() => []),
      ]);
      setProveedores(p);
      setOrdenesCompra(oc);
    } catch (e) {
      setProveedores([]);
      showToast(e.message || 'Error cargando proveedores', 'urgent');
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const uid = user?.id_usuario ?? 1;
  const provMap = useMemo(
    () => new Map((proveedores || []).map((p) => [p.id_proveedor, p.empresa])),
    [proveedores],
  );

  const openCreateProv = () => { setEditingProv(null); setProvForm(EMPTY_PROV); setError(''); setProvModal(true); };
  const openEditProv = (p) => {
    setEditingProv(p);
    setProvForm({
      empresa: p.empresa, contacto: p.contacto || '', telefono: p.telefono || '',
      correo: p.correo || '', direccion: p.direccion || '', activo: Boolean(p.activo),
    });
    setError('');
    setProvModal(true);
  };

  const saveProv = async (e) => {
    e.preventDefault();
    if (!provForm.empresa.trim()) return;
    setSaving(true);
    setError('');
    try {
      const body = {
        empresa: provForm.empresa.trim(),
        contacto: provForm.contacto.trim() || null,
        telefono: provForm.telefono.trim() || null,
        correo: provForm.correo.trim() || null,
        direccion: provForm.direccion.trim() || null,
        activo: Boolean(provForm.activo),
        creado_por: editingProv?.creado_por ?? uid,
        actualizado_por: uid,
      };
      if (editingProv) {
        await proveedoresService.updateProveedor(editingProv.id_proveedor, body);
        showToast('Proveedor actualizado', 'success');
      } else {
        await proveedoresService.createProveedor(body);
        showToast('Proveedor creado', 'success');
      }
      setProvModal(false);
      load();
    } catch (err) {
      setError(err.message || 'Error guardando proveedor');
    } finally {
      setSaving(false);
    }
  };

  const removeProv = async (p) => {
    if (!window.confirm(`¿Eliminar al proveedor "${p.empresa}"?`)) return;
    try {
      await proveedoresService.deleteProveedor(p.id_proveedor);
      showToast('Proveedor eliminado', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error eliminando proveedor', 'urgent');
    }
  };

  const saveOC = async (e) => {
    e.preventDefault();
    if (!ocForm.id_proveedor || !ocForm.total) {
      setError('Selecciona proveedor y total');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await proveedoresService.createOrdenCompra({
        id_proveedor: Number(ocForm.id_proveedor),
        id_usuario: uid,
        fecha: new Date().toISOString().slice(0, 10),
        total: Number(ocForm.total),
        estado: ocForm.estado,
        actualizado_por: uid,
      });
      showToast('Orden de compra creada', 'success');
      setOcModal(false);
      setOcForm({ id_proveedor: '', total: '', estado: 'pendiente' });
      load();
    } catch (err) {
      setError(err.message || 'Error creando orden de compra');
    } finally {
      setSaving(false);
    }
  };

  return <>
    <PageIntro
      eyebrow="Abastecimiento"
      title="Proveedores y compras"
      description="Administra proveedores y órdenes de compra de insumos."
      action={<button className="primary-btn" onClick={() => { setError(''); setOcModal(true); }}><Plus size={17}/> Nueva orden de compra</button>}
    />
    <div className="content-grid two">
      <section className="panel">
        <div className="panel-head">
          <div><h3>Proveedores</h3><p>{proveedores ? `${proveedores.filter((p) => p.activo).length} activos de ${proveedores.length}` : 'Cargando...'}</p></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Truck size={20} />
            <button className="secondary-btn" onClick={openCreateProv}><Plus size={15} /> Nuevo</button>
          </div>
        </div>
        {proveedores === null ? (
          <EmptyPanel title="Cargando proveedores..." text="Consultando /proveedores." />
        ) : proveedores.length === 0 ? (
          <EmptyPanel title="Sin proveedores" text="Registra el primer proveedor." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Empresa</th><th>Contacto</th><th>Teléfono</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {proveedores.map((p) => (
                  <tr key={p.id_proveedor}>
                    <td><strong>{p.empresa}</strong></td>
                    <td>{p.contacto || '—'}</td>
                    <td>{p.telefono || '—'}</td>
                    <td>{p.activo
                      ? <span className="resv-status confirmada">Activo</span>
                      : <span className="resv-status cancelada">Inactivo</span>}
                    </td>
                    <td>
                      <div className="category-actions">
                        <button className="resv-mini-btn" title="Editar" onClick={() => openEditProv(p)} type="button"><Pencil size={14} /></button>
                        <button className="resv-mini-btn danger" title="Eliminar" onClick={() => removeProv(p)} type="button"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-head"><h3>Órdenes de compra</h3><ClipboardPlus size={20} /></div>
        {ordenesCompra === null ? (
          <EmptyPanel title="Cargando órdenes..." text="Consultando /ordenes_compra." />
        ) : ordenesCompra.length === 0 ? (
          <EmptyPanel title="Sin órdenes de compra" text="Crea la primera con «Nueva orden de compra»." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Proveedor</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
              <tbody>
                {ordenesCompra.map((oc) => (
                  <tr key={oc.id_orden_compra}>
                    <td><strong>#{oc.id_orden_compra}</strong></td>
                    <td>{provMap.get(oc.id_proveedor) || `#${oc.id_proveedor}`}</td>
                    <td>{formatDateTime(oc.fecha)}</td>
                    <td><strong>{formatMoney(Number(oc.total))}</strong></td>
                    <td><span className={`resv-status ${OC_ESTADOS[oc.estado] || 'pendiente'}`}>{oc.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>

    {provModal && (
      <>
        <div className="modal-overlay" onClick={() => setProvModal(false)} />
        <div className="modal-container">
          <div className="modal-header">
            <h2><Truck size={20} /> {editingProv ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
            <button className="modal-close" onClick={() => setProvModal(false)} type="button"><X size={20} /></button>
          </div>
          <form className="modal-body" onSubmit={saveProv}>
            <label className="modal-label">Empresa
              <input className="modal-input" required value={provForm.empresa}
                onChange={(e) => setProvForm({ ...provForm, empresa: e.target.value })} placeholder="Ej. Alimentos del Valle S.A.S." />
            </label>
            <div className="modal-row">
              <label className="modal-label">Contacto
                <input className="modal-input" value={provForm.contacto}
                  onChange={(e) => setProvForm({ ...provForm, contacto: e.target.value })} placeholder="Nombre del contacto" />
              </label>
              <label className="modal-label">Teléfono
                <input className="modal-input" value={provForm.telefono}
                  onChange={(e) => setProvForm({ ...provForm, telefono: e.target.value })} placeholder="300 123 4567" />
              </label>
            </div>
            <label className="modal-label">Correo
              <input className="modal-input" type="email" value={provForm.correo}
                onChange={(e) => setProvForm({ ...provForm, correo: e.target.value })} placeholder="ventas@proveedor.com" />
            </label>
            <label className="modal-label">Dirección
              <input className="modal-input" value={provForm.direccion}
                onChange={(e) => setProvForm({ ...provForm, direccion: e.target.value })} placeholder="Calle 123" />
            </label>
            {error && <div className="login-error" role="alert" style={{ margin: 0 }}>{error}</div>}
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setProvModal(false)}>Cancelar</button>
              <button type="submit" className="secondary-btn" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      </>
    )}

    {ocModal && (
      <>
        <div className="modal-overlay" onClick={() => setOcModal(false)} />
        <div className="modal-container">
          <div className="modal-header">
            <h2><ClipboardPlus size={20} /> Nueva orden de compra</h2>
            <button className="modal-close" onClick={() => setOcModal(false)} type="button"><X size={20} /></button>
          </div>
          <form className="modal-body" onSubmit={saveOC}>
            <label className="modal-label">Proveedor
              <select className="modal-input" required value={ocForm.id_proveedor}
                onChange={(e) => setOcForm({ ...ocForm, id_proveedor: e.target.value })}>
                <option value="">Seleccionar proveedor</option>
                {(proveedores || []).filter((p) => p.activo).map((p) => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>{p.empresa}</option>
                ))}
              </select>
            </label>
            <div className="modal-row">
              <label className="modal-label">Total (COP)
                <input className="modal-input" type="number" min="0" required value={ocForm.total}
                  onChange={(e) => setOcForm({ ...ocForm, total: e.target.value })} placeholder="0" />
              </label>
              <label className="modal-label">Estado
                <select className="modal-input" value={ocForm.estado}
                  onChange={(e) => setOcForm({ ...ocForm, estado: e.target.value })}>
                  <option value="pendiente">Pendiente</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="recibida">Recibida</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </label>
            </div>
            {error && <div className="login-error" role="alert" style={{ margin: 0 }}>{error}</div>}
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setOcModal(false)}>Cancelar</button>
              <button type="submit" className="secondary-btn" disabled={saving}>{saving ? 'Creando...' : 'Crear orden'}</button>
            </div>
          </form>
        </div>
      </>
    )}
  </>;
}
