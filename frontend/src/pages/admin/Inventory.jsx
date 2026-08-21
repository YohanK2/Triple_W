import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine, ArrowUpFromLine, Boxes, Plus, Pencil, Trash2, X, PackagePlus,
} from 'lucide-react';
import PageIntro from '../../components/common/PageIntro.jsx';
import EmptyPanel from '../../components/common/EmptyPanel.jsx';
import { useToast } from '../../components/Toast';
import { inventarioService } from '../../services/inventarioService';
import { useAuth } from '../../context/AuthContext';

const EMPTY_ING = { nombre: '', descripcion: '', unidad_medida: 'kg', stock_actual: 0, stock_minimo: 0, activo: true };

export default function Inventory() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [ingredientes, setIngredientes] = useState(null);
  const [ingModal, setIngModal] = useState(false);
  const [editingIng, setEditingIng] = useState(null);
  const [ingForm, setIngForm] = useState(EMPTY_ING);
  const [movModal, setMovModal] = useState(false);
  const [movForm, setMovForm] = useState({ id_ingrediente: '', tipo_movimiento: 'entrada', cantidad: 1, motivo: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setIngredientes(await inventarioService.getIngredientes());
    } catch (e) {
      setIngredientes([]);
      showToast(e.message || 'Error cargando inventario', 'urgent');
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const uid = user?.id_usuario ?? 1;

  const stats = useMemo(() => {
    if (!ingredientes) return { total: 0, bajos: 0, agotados: 0 };
    return {
      total: ingredientes.length,
      bajos: ingredientes.filter((i) => Number(i.stock_actual) > 0 && Number(i.stock_actual) <= Number(i.stock_minimo)).length,
      agotados: ingredientes.filter((i) => Number(i.stock_actual) <= 0).length,
    };
  }, [ingredientes]);

  const stockDot = (i) => {
    if (Number(i.stock_actual) <= 0) return 'danger';
    if (Number(i.stock_actual) <= Number(i.stock_minimo)) return 'warn';
    return 'ok';
  };

  const openCreateIng = () => { setEditingIng(null); setIngForm(EMPTY_ING); setError(''); setIngModal(true); };
  const openEditIng = (i) => {
    setEditingIng(i);
    setIngForm({
      nombre: i.nombre, descripcion: i.descripcion || '',
      unidad_medida: i.unidad_medida, stock_actual: Number(i.stock_actual),
      stock_minimo: Number(i.stock_minimo), activo: Boolean(i.activo),
    });
    setError('');
    setIngModal(true);
  };

  const saveIng = async (e) => {
    e.preventDefault();
    if (!ingForm.nombre.trim()) return;
    setSaving(true);
    setError('');
    try {
      const body = {
        nombre: ingForm.nombre.trim(),
        descripcion: ingForm.descripcion.trim() || null,
        unidad_medida: ingForm.unidad_medida,
        stock_actual: Number(ingForm.stock_actual),
        stock_minimo: Number(ingForm.stock_minimo),
        activo: Boolean(ingForm.activo),
        creado_por: editingIng?.creado_por ?? uid,
        actualizado_por: uid,
      };
      if (editingIng) {
        await inventarioService.updateIngrediente(editingIng.id_ingrediente, body);
        showToast('Ingrediente actualizado', 'success');
      } else {
        await inventarioService.createIngrediente(body);
        showToast('Ingrediente creado', 'success');
      }
      setIngModal(false);
      load();
    } catch (err) {
      setError(err.message || 'Error guardando ingrediente');
    } finally {
      setSaving(false);
    }
  };

  const removeIng = async (i) => {
    if (!window.confirm(`¿Eliminar "${i.nombre}" del inventario?`)) return;
    try {
      await inventarioService.deleteIngrediente(i.id_ingrediente);
      showToast('Ingrediente eliminado', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error eliminando', 'urgent');
    }
  };

  const saveMov = async (e) => {
    e.preventDefault();
    if (!movForm.id_ingrediente || !movForm.motivo.trim()) {
      setError('Selecciona el ingrediente y describe el motivo');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const ing = ingredientes.find((x) => String(x.id_ingrediente) === String(movForm.id_ingrediente));
      const cantidad = Number(movForm.cantidad);
      await inventarioService.registrarMovimiento({
        id_ingrediente: ing.id_ingrediente,
        tipo_movimiento: movForm.tipo_movimiento,
        cantidad,
        motivo: movForm.motivo.trim(),
        id_usuario: uid,
      });
      /* El backend no ajusta stock automáticamente: se sincroniza aquí */
      let nuevoStock = Number(ing.stock_actual);
      if (movForm.tipo_movimiento === 'entrada') nuevoStock += cantidad;
      else if (movForm.tipo_movimiento === 'salida') nuevoStock = Math.max(0, nuevoStock - cantidad);
      else nuevoStock = cantidad;
      await inventarioService.updateIngrediente(ing.id_ingrediente, {
        nombre: ing.nombre,
        descripcion: ing.descripcion,
        unidad_medida: ing.unidad_medida,
        stock_actual: nuevoStock,
        stock_minimo: Number(ing.stock_minimo),
        activo: Boolean(ing.activo),
        creado_por: ing.creado_por ?? uid,
        actualizado_por: uid,
      });
      showToast('Movimiento registrado y stock actualizado', 'success');
      setMovModal(false);
      setMovForm({ id_ingrediente: '', tipo_movimiento: 'entrada', cantidad: 1, motivo: '' });
      load();
    } catch (err) {
      setError(err.message || 'Error registrando movimiento');
    } finally {
      setSaving(false);
    }
  };

  return <>
    <PageIntro
      eyebrow="Operación"
      title="Inventario"
      description="Controla ingredientes, stock mínimo y movimientos de inventario."
      action={<button className="primary-btn" onClick={() => { setError(''); setMovModal(true); }}><Plus size={17}/> Registrar movimiento</button>}
    />
    <div className="inventory-legend">
      <span><i className="status-dot ok"/> Stock normal</span>
      <span><i className="status-dot warn"/> Stock bajo</span>
      <span><i className="status-dot danger"/> Agotado</span>
      <span className="category-product-count">{stats.total} ingredientes</span>
      <span className="category-product-count" style={{ background: '#fbf0d1' }}>{stats.bajos} bajos</span>
      <span className="category-product-count" style={{ background: '#fff5f3', color: '#b9573d' }}>{stats.agotados} agotados</span>
    </div>
    <section className="panel">
      <div className="panel-head">
        <div>
          <h3>Ingredientes</h3>
          <p>Semáforo de stock según stock_actual y stock_minimo.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Boxes size={20} />
          <button className="secondary-btn" onClick={openCreateIng}><PackagePlus size={15} /> Nuevo ingrediente</button>
        </div>
      </div>
      {ingredientes === null ? (
        <EmptyPanel title="Cargando inventario..." text="Consultando /ingredientes." />
      ) : ingredientes.length === 0 ? (
        <EmptyPanel title="Sin ingredientes cargados" text="Crea el primer ingrediente del inventario." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Unidad</th><th>Stock actual</th><th>Stock mínimo</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {ingredientes.map((i) => (
                <tr key={i.id_ingrediente}>
                  <td>{i.id_ingrediente}</td>
                  <td><strong>{i.nombre}</strong></td>
                  <td>{i.unidad_medida}</td>
                  <td>{Number(i.stock_actual)} {i.unidad_medida}</td>
                  <td>{Number(i.stock_minimo)} {i.unidad_medida}</td>
                  <td><span className="category-status"><span className={`status-dot ${stockDot(i)}`} />
                    {stockDot(i) === 'danger' ? 'Agotado' : stockDot(i) === 'warn' ? 'Bajo' : 'Normal'}
                  </span></td>
                  <td>
                    <div className="category-actions">
                      <button className="resv-mini-btn" title="Editar" onClick={() => openEditIng(i)} type="button"><Pencil size={14} /></button>
                      <button className="resv-mini-btn danger" title="Eliminar" onClick={() => removeIng(i)} type="button"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
    <div className="quick-actions">
      <button className="secondary-btn" onClick={() => { setMovForm({ id_ingrediente: '', tipo_movimiento: 'entrada', cantidad: 1, motivo: 'Compra a proveedor' }); setError(''); setMovModal(true); }}>
        <ArrowDownToLine size={17}/> Entrada de compra
      </button>
      <button className="ghost-btn" onClick={() => { setMovForm({ id_ingrediente: '', tipo_movimiento: 'salida', cantidad: 1, motivo: 'Merma' }); setError(''); setMovModal(true); }}>
        <ArrowUpFromLine size={17}/> Salida por merma o ajuste
      </button>
    </div>

    {ingModal && (
      <>
        <div className="modal-overlay" onClick={() => setIngModal(false)} />
        <div className="modal-container">
          <div className="modal-header">
            <h2><Boxes size={20} /> {editingIng ? 'Editar ingrediente' : 'Nuevo ingrediente'}</h2>
            <button className="modal-close" onClick={() => setIngModal(false)} type="button"><X size={20} /></button>
          </div>
          <form className="modal-body" onSubmit={saveIng}>
            <label className="modal-label">Nombre
              <input className="modal-input" required value={ingForm.nombre}
                onChange={(e) => setIngForm({ ...ingForm, nombre: e.target.value })} placeholder="Ej. Harina de trigo" />
            </label>
            <label className="modal-label">Descripción
              <input className="modal-input" value={ingForm.descripcion}
                onChange={(e) => setIngForm({ ...ingForm, descripcion: e.target.value })} placeholder="Opcional" />
            </label>
            <div className="modal-row">
              <label className="modal-label">Unidad de medida
                <select className="modal-input" value={ingForm.unidad_medida}
                  onChange={(e) => setIngForm({ ...ingForm, unidad_medida: e.target.value })}>
                  <option value="kg">kg</option><option value="g">g</option><option value="L">L</option>
                  <option value="ml">ml</option><option value="unidades">unidades</option>
                </select>
              </label>
              <label className="modal-label">Activo
                <select className="modal-input" value={ingForm.activo ? 'si' : 'no'}
                  onChange={(e) => setIngForm({ ...ingForm, activo: e.target.value === 'si' })}>
                  <option value="si">Sí</option><option value="no">No</option>
                </select>
              </label>
            </div>
            <div className="modal-row">
              <label className="modal-label">Stock actual
                <input className="modal-input" type="number" step="0.001" min="0" value={ingForm.stock_actual}
                  onChange={(e) => setIngForm({ ...ingForm, stock_actual: e.target.value })} required />
              </label>
              <label className="modal-label">Stock mínimo
                <input className="modal-input" type="number" step="0.001" min="0" value={ingForm.stock_minimo}
                  onChange={(e) => setIngForm({ ...ingForm, stock_minimo: e.target.value })} required />
              </label>
            </div>
            {error && <div className="login-error" role="alert" style={{ margin: 0 }}>{error}</div>}
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setIngModal(false)}>Cancelar</button>
              <button type="submit" className="secondary-btn" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      </>
    )}

    {movModal && (
      <>
        <div className="modal-overlay" onClick={() => setMovModal(false)} />
        <div className="modal-container">
          <div className="modal-header">
            <h2><Plus size={20} /> Registrar movimiento</h2>
            <button className="modal-close" onClick={() => setMovModal(false)} type="button"><X size={20} /></button>
          </div>
          <form className="modal-body" onSubmit={saveMov}>
            <label className="modal-label">Ingrediente
              <select className="modal-input" required value={movForm.id_ingrediente}
                onChange={(e) => setMovForm({ ...movForm, id_ingrediente: e.target.value })}>
                <option value="">Seleccionar ingrediente</option>
                {(ingredientes || []).map((i) => (
                  <option key={i.id_ingrediente} value={i.id_ingrediente}>
                    {i.nombre} ({Number(i.stock_actual)} {i.unidad_medida})
                  </option>
                ))}
              </select>
            </label>
            <div className="modal-row">
              <label className="modal-label">Tipo
                <select className="modal-input" value={movForm.tipo_movimiento}
                  onChange={(e) => setMovForm({ ...movForm, tipo_movimiento: e.target.value })}>
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                  <option value="ajuste">Ajuste (fija el stock)</option>
                </select>
              </label>
              <label className="modal-label">Cantidad
                <input className="modal-input" type="number" step="0.001" min="0" value={movForm.cantidad}
                  onChange={(e) => setMovForm({ ...movForm, cantidad: e.target.value })} required />
              </label>
            </div>
            <label className="modal-label">Motivo
              <input className="modal-input" required value={movForm.motivo}
                onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })} placeholder="Ej. Compra, merma, ajuste de conteo" />
            </label>
            {error && <div className="login-error" role="alert" style={{ margin: 0 }}>{error}</div>}
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setMovModal(false)}>Cancelar</button>
              <button type="submit" className="secondary-btn" disabled={saving}>{saving ? 'Registrando...' : 'Registrar'}</button>
            </div>
          </form>
        </div>
      </>
    )}
  </>;
}
