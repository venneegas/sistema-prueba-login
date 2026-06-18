import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Building2,
  CalendarClock,
  CheckSquare,
  ClipboardList,
  Gauge,
  History,
  KeyRound,
  Link2,
  Lock,
  Megaphone,
  RefreshCw,
  Save,
  Search,
  Unlock,
  Users
} from 'lucide-react';
import { buildApiUrl } from '../../config/api';
import AdminPageHeader from './AdminPageHeader';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, index) => currentYear - 1 + index);
const trimestres = [1, 2, 3, 4];

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

const toDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const AdminControlView = ({ showToast }) => {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [summary, setSummary] = useState(null);
  const [periodos, setPeriodos] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [especialistas, setEspecialistas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [prorrogas, setProrrogas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [comprobantes, setComprobantes] = useState([]);
  const [anio, setAnio] = useState(currentYear >= 2026 ? currentYear : 2026);
  const [trimestre, setTrimestre] = useState(1);
  const [directorId, setDirectorId] = useState('');
  const [institucionId, setInstitucionId] = useState('');
  const [especialistaId, setEspecialistaId] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [search, setSearch] = useState('');
  const [periodoForm, setPeriodoForm] = useState({
    trimestre: 1,
    fechaLimite: '',
    descripcion: ''
  });
  const [prorrogaForm, setProrrogaForm] = useState({
    fechaLimite: '',
    motivo: ''
  });
  const [avisoForm, setAvisoForm] = useState({
    titulo: '',
    mensaje: '',
    rolDestino: 'todos',
    visibleHasta: ''
  });
  const [comprobanteNombre, setComprobanteNombre] = useState('');
  const [bulkSelected, setBulkSelected] = useState([]);
  const [bulkReplace, setBulkReplace] = useState(true);
  const [institucionForm, setInstitucionForm] = useState(null);

  const fetchJson = useCallback(async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders(),
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'No se pudo completar la operacion.');
    }
    return data;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        summaryData,
        periodosData,
        institucionesData,
        especialistasData,
        usuariosData,
        prorrogasData,
        historialData,
        avisosData,
        comprobantesData
      ] = await Promise.all([
        fetchJson(buildApiUrl('/api/admin/resumen')),
        fetchJson(buildApiUrl(`/api/admin/periodos?anio=${anio}`)),
        fetchJson(buildApiUrl('/api/admin/instituciones')),
        fetchJson(buildApiUrl('/api/admin/especialistas')),
        fetchJson(buildApiUrl('/api/admin/usuarios')),
        fetchJson(buildApiUrl('/api/admin/prorrogas')),
        fetchJson(buildApiUrl('/api/admin/cierres/historial')),
        fetchJson(buildApiUrl('/api/admin/avisos')),
        fetchJson(buildApiUrl('/api/admin/comprobantes-admin'))
      ]);

      setSummary(summaryData.data);
      setPeriodos(periodosData.data || []);
      setInstituciones(institucionesData.data || []);
      setEspecialistas(especialistasData.data || []);
      setUsuarios(usuariosData.data || []);
      setProrrogas(prorrogasData.data || []);
      setHistorial(historialData.data || []);
      setAvisos(avisosData.data || []);
      setComprobantes(comprobantesData.data || []);

      const firstInstitution = institucionesData.data?.[0];
      setDirectorId((prev) => prev || (firstInstitution?.director_id ? String(firstInstitution.director_id) : ''));
      setInstitucionId((prev) => prev || (firstInstitution?.id ? String(firstInstitution.id) : ''));
      setInstitucionForm((prev) => prev || firstInstitution || null);
      setEspecialistaId((prev) => prev || (especialistasData.data?.[0]?.id ? String(especialistasData.data[0].id) : ''));
      setUsuarioId((prev) => prev || (usuariosData.data?.[0]?.id ? String(usuariosData.data[0].id) : ''));
    } catch (error) {
      showToast?.(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [anio, fetchJson, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredInstituciones = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return instituciones;
    return instituciones.filter((item) => (
      String(item.nombre || '').toLowerCase().includes(term)
      || String(item.numero || '').toLowerCase().includes(term)
      || String(item.codigo_modular || '').toLowerCase().includes(term)
      || String(item.director || '').toLowerCase().includes(term)
    ));
  }, [instituciones, search]);

  const selectedPeriodo = useMemo(
    () => periodos.find((item) => Number(item.trimestre) === Number(periodoForm.trimestre)),
    [periodos, periodoForm.trimestre]
  );

  const selectedDirectorInstitution = useMemo(
    () => instituciones.find((item) => String(item.director_id) === String(directorId)),
    [instituciones, directorId]
  );

  useEffect(() => {
    if (!selectedPeriodo) return;
    setPeriodoForm((prev) => ({
      ...prev,
      fechaLimite: toDateTimeLocal(selectedPeriodo.fechaLimite),
      descripcion: selectedPeriodo.descripcion || ''
    }));
  }, [selectedPeriodo]);

  useEffect(() => {
    const currentProrroga = prorrogas.find((item) => (
      String(item.director_id) === String(directorId)
      && Number(item.anio) === Number(anio)
      && Number(item.trimestre) === Number(trimestre)
    ));

    setProrrogaForm({
      fechaLimite: toDateTimeLocal(currentProrroga?.fecha_limite),
      motivo: currentProrroga?.motivo || ''
    });
  }, [anio, directorId, prorrogas, trimestre]);

  const runAction = async (key, action, successMessage) => {
    setSavingKey(key);
    try {
      await action();
      showToast?.(successMessage || 'Operacion completada correctamente.');
      await loadData();
      return true;
    } catch (error) {
      showToast?.(error.message, 'error');
      return false;
    } finally {
      setSavingKey('');
    }
  };

  const updatePeriodo = () => runAction('periodo', () => fetchJson(buildApiUrl('/api/admin/periodos'), {
    method: 'PUT',
    body: JSON.stringify({
      anio,
      trimestre: periodoForm.trimestre,
      fechaLimite: periodoForm.fechaLimite,
      descripcion: periodoForm.descripcion
    })
  }), 'Periodo actualizado.');

  const cambiarCierre = (accion) => runAction(`cierre-${accion}`, () => fetchJson(buildApiUrl('/api/admin/cierres'), {
    method: 'POST',
    body: JSON.stringify({ directorId, anio, trimestre, accion, motivo: prorrogaForm.motivo })
  }), accion === 'cerrar' ? 'Trimestre cerrado por admin.' : 'Trimestre reabierto por admin.');

  const guardarProrroga = () => runAction('prorroga', () => fetchJson(buildApiUrl('/api/admin/prorrogas'), {
    method: 'PUT',
    body: JSON.stringify({
      directorId,
      anio,
      trimestre,
      fechaLimite: prorrogaForm.fechaLimite,
      motivo: prorrogaForm.motivo
    })
  }), 'Prorroga por institucion guardada.');

  const saveInstitucion = () => {
    if (!institucionForm?.id) return;
    return runAction('institucion', () => fetchJson(buildApiUrl(`/api/admin/instituciones/${institucionForm.id}`), {
      method: 'PUT',
      body: JSON.stringify(institucionForm)
    }), 'Institucion actualizada.');
  };

  const asignar = () => runAction('asignar', () => fetchJson(buildApiUrl('/api/admin/asignaciones'), {
    method: 'POST',
    body: JSON.stringify({ institucionId, especialistaId })
  }), 'Especialista asignado.');

  const toggleBulkInstitution = (id) => {
    setBulkSelected((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };

  const asignarMasivo = () => runAction('asignar-masivo', () => fetchJson(buildApiUrl('/api/admin/asignaciones/masivas'), {
    method: 'POST',
    body: JSON.stringify({
      especialistaId,
      institucionIds: bulkSelected,
      replace: bulkReplace
    })
  }), `Asignacion masiva aplicada a ${bulkSelected.length} I.E.`);

  const crearAviso = () => runAction('aviso', () => fetchJson(buildApiUrl('/api/admin/avisos'), {
    method: 'POST',
    body: JSON.stringify(avisoForm)
  }), 'Aviso global publicado.').then((success) => {
    if (success) setAvisoForm({ titulo: '', mensaje: '', rolDestino: 'todos', visibleHasta: '' });
  });

  const toggleAviso = (aviso) => runAction(`aviso-${aviso.id}`, () => fetchJson(buildApiUrl(`/api/admin/avisos/${aviso.id}`), {
    method: 'PUT',
    body: JSON.stringify({ activo: !aviso.activo })
  }), aviso.activo ? 'Aviso desactivado.' : 'Aviso activado.');

  const crearComprobante = () => runAction('comprobante', () => fetchJson(buildApiUrl('/api/admin/comprobantes-admin'), {
    method: 'POST',
    body: JSON.stringify({ nombre: comprobanteNombre })
  }), 'Comprobante creado.').then((success) => {
    if (success) setComprobanteNombre('');
  });

  const toggleComprobante = (comprobante) => runAction(`comprobante-${comprobante.id}`, () => fetchJson(buildApiUrl(`/api/admin/comprobantes-admin/${comprobante.id}`), {
    method: 'PUT',
    body: JSON.stringify({ nombre: comprobante.nombre, activo: !comprobante.activo })
  }), comprobante.activo ? 'Comprobante desactivado.' : 'Comprobante activado.');

  const resetPassword = () => runAction('password', () => fetchJson(buildApiUrl(`/api/admin/usuarios/${usuarioId}/reset-password`), {
    method: 'POST',
    body: JSON.stringify({ password: newPassword, forceChange: true })
  }), 'Contrasena restablecida y cambio forzado.');

  return (
    <>
      <AdminPageHeader
        icon={Gauge}
        title="Control UGEL"
        subtitle="Administra periodos, instituciones, asignaciones, credenciales y el estado global del sistema."
        actions={(
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        )}
      />

      <div className="flex-1 overflow-y-auto bg-slate-50 p-8 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
            {[
              ['Usuarios activos', summary?.usuarios?.activos || 0, Users],
              ['Instituciones', summary?.instituciones || 0, Building2],
              ['Cierres registrados', summary?.cierres || 0, Lock],
              ['Estados auditables', summary?.estados?.reduce((sum, item) => sum + Number(item.total || 0), 0) || 0, Gauge]
            ].map(([label, value, Icon]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
                  <Icon size={20} className="text-blue-700 dark:text-blue-300" />
                </div>
                <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-5 flex items-center gap-3">
              <CalendarClock className="text-blue-700 dark:text-blue-300" size={22} />
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Control de periodos y cierres</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Amplia plazos o reabre una institucion sin tocar codigo.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
              <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <select value={periodoForm.trimestre} onChange={(e) => setPeriodoForm((prev) => ({ ...prev, trimestre: Number(e.target.value) }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {trimestres.map((item) => <option key={item} value={item}>T{item}</option>)}
              </select>
              <input type="datetime-local" value={periodoForm.fechaLimite} onChange={(e) => setPeriodoForm((prev) => ({ ...prev, fechaLimite: e.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 lg:col-span-2" />
              <input value={periodoForm.descripcion} onChange={(e) => setPeriodoForm((prev) => ({ ...prev, descripcion: e.target.value }))} placeholder="Motivo de prorroga" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 lg:col-span-2" />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={updatePeriodo} disabled={savingKey === 'periodo'} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"><Save size={18} /> Guardar plazo</button>
              <select value={directorId} onChange={(e) => setDirectorId(e.target.value)} className="min-w-72 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {instituciones.filter((item) => item.director_id).map((item) => <option key={item.director_id} value={item.director_id}>{item.numero || '-'} - {item.nombre}</option>)}
              </select>
              <select value={trimestre} onChange={(e) => setTrimestre(Number(e.target.value))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {trimestres.map((item) => <option key={item} value={item}>T{item}</option>)}
              </select>
              <button onClick={() => cambiarCierre('reabrir')} disabled={!directorId || savingKey === 'cierre-reabrir'} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"><Unlock size={18} /> Reabrir</button>
              <button onClick={() => cambiarCierre('cerrar')} disabled={!directorId || savingKey === 'cierre-cerrar'} className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-900 disabled:opacity-60"><Lock size={18} /> Cerrar</button>
            </div>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
              <div className="mb-3 flex items-center gap-2">
                <CalendarClock size={18} className="text-blue-700 dark:text-blue-300" />
                <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                  Prorroga puntual: {selectedDirectorInstitution ? `${selectedDirectorInstitution.numero || '-'} - ${selectedDirectorInstitution.nombre}` : 'selecciona una institucion'}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_1fr_auto]">
                <input type="datetime-local" value={prorrogaForm.fechaLimite} onChange={(e) => setProrrogaForm((prev) => ({ ...prev, fechaLimite: e.target.value }))} className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold dark:border-blue-900 dark:bg-slate-900 dark:text-slate-200" />
                <input value={prorrogaForm.motivo} onChange={(e) => setProrrogaForm((prev) => ({ ...prev, motivo: e.target.value }))} placeholder="Motivo administrativo de la prorroga o reapertura" className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm dark:border-blue-900 dark:bg-slate-900 dark:text-slate-200" />
                <button onClick={guardarProrroga} disabled={!directorId || !prorrogaForm.fechaLimite || savingKey === 'prorroga'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"><Save size={18} /> Guardar prorroga</button>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-5 flex items-center gap-3">
                <Building2 className="text-blue-700 dark:text-blue-300" size={22} />
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Instituciones educativas</h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Edita datos base y selecciona colegios para asignaciones.</p>
                </div>
              </div>
              <label className="relative mb-4 block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar institucion, codigo o director..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
              </label>
              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-700">
                {filteredInstituciones.slice(0, 80).map((item) => (
                  <div key={item.id} className={`flex items-start gap-3 border-b border-slate-100 px-4 py-3 text-sm hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-900 ${institucionForm?.id === item.id ? 'bg-blue-50 dark:bg-slate-900' : ''}`}>
                    <input type="checkbox" checked={bulkSelected.includes(item.id)} onChange={() => toggleBulkInstitution(item.id)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500" />
                    <button type="button" onClick={() => { setInstitucionForm(item); setInstitucionId(String(item.id)); if (item.director_id) setDirectorId(String(item.director_id)); }} className="flex-1 text-left">
                      <p className="font-black text-slate-800 dark:text-slate-100">{item.numero || '-'} - {item.nombre}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Director: {item.director || 'Sin director'} | Especialistas: {item.especialistas || 'Sin asignar'}</p>
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-5 flex items-center gap-3">
                <Link2 className="text-blue-700 dark:text-blue-300" size={22} />
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Editar y asignar</h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Actualiza una I.E. y asigna especialista responsable.</p>
                </div>
              </div>
              {institucionForm && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input value={institucionForm.nombre || ''} onChange={(e) => setInstitucionForm({ ...institucionForm, nombre: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 md:col-span-2" />
                  <input value={institucionForm.numero || ''} onChange={(e) => setInstitucionForm({ ...institucionForm, numero: e.target.value })} placeholder="Numero IE" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
                  <input value={institucionForm.codigo_modular || ''} onChange={(e) => setInstitucionForm({ ...institucionForm, codigo_modular: e.target.value })} placeholder="Codigo modular" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
                  <input value={institucionForm.ruc || ''} onChange={(e) => setInstitucionForm({ ...institucionForm, ruc: e.target.value })} placeholder="RUC" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
                  <input value={institucionForm.provincia || ''} onChange={(e) => setInstitucionForm({ ...institucionForm, provincia: e.target.value })} placeholder="Provincia" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
                  <select value={institucionForm.nivel_educativo || 'primaria'} onChange={(e) => setInstitucionForm({ ...institucionForm, nivel_educativo: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {['inicial', 'primaria', 'secundaria', 'tecnico', 'superior'].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                  <select value={institucionForm.modalidad || 'regular'} onChange={(e) => setInstitucionForm({ ...institucionForm, modalidad: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {['regular', 'especial', 'alternativa'].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                  <button onClick={saveInstitucion} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 md:col-span-2"><Save size={18} /> Guardar institucion</button>
                </div>
              )}
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <select value={institucionId} onChange={(e) => setInstitucionId(e.target.value)} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {instituciones.map((item) => <option key={item.id} value={item.id}>{item.numero || '-'} - {item.nombre}</option>)}
                </select>
                <select value={especialistaId} onChange={(e) => setEspecialistaId(e.target.value)} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {especialistas.map((item) => <option key={item.id} value={item.id}>{item.nombre || item.email}</option>)}
                </select>
                <button onClick={asignar} disabled={!institucionId || !especialistaId} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 md:whitespace-nowrap">Asignar</button>
              </div>
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <div className="mb-3 flex items-center gap-2">
                  <CheckSquare size={18} className="text-emerald-700 dark:text-emerald-300" />
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">Asignacion masiva: {bulkSelected.length} I.E. seleccionadas</p>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                  <label className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                    <input type="checkbox" checked={bulkReplace} onChange={(e) => setBulkReplace(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="min-w-0">Reemplazar cartera actual</span>
                  </label>
                  <button onClick={() => setBulkSelected(filteredInstituciones.slice(0, 80).map((item) => item.id))} className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-300 lg:whitespace-nowrap">Seleccionar visibles</button>
                  <button onClick={() => setBulkSelected([])} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 lg:whitespace-nowrap">Limpiar</button>
                  <button onClick={asignarMasivo} disabled={!especialistaId || bulkSelected.length === 0 || savingKey === 'asignar-masivo'} className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 lg:whitespace-nowrap">Aplicar masivo</button>
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-5 flex items-center gap-3">
                <History className="text-blue-700 dark:text-blue-300" size={22} />
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Historial de reaperturas y prorrogas</h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Registro reciente de acciones administrativas sobre trimestres.</p>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-700">
                {historial.length === 0 ? (
                  <p className="p-4 text-sm font-medium text-slate-500 dark:text-slate-400">Aun no hay acciones registradas.</p>
                ) : historial.slice(0, 20).map((item) => (
                  <div key={item.id} className="border-b border-slate-100 px-4 py-3 text-sm dark:border-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-black text-slate-800 dark:text-slate-100">{item.accion} T{item.trimestre}-{item.anio}</p>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600 dark:bg-slate-900 dark:text-slate-300">{new Date(item.fecha).toLocaleString('es-PE')}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.numero || '-'} - {item.institucion || `Director ${item.director_id}`}</p>
                    {item.motivo && <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">{item.motivo}</p>}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-5 flex items-center gap-3">
                <Megaphone className="text-blue-700 dark:text-blue-300" size={22} />
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Avisos globales</h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Publica mensajes para directores, especialistas o todo el sistema.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px]">
                <input value={avisoForm.titulo} onChange={(e) => setAvisoForm((prev) => ({ ...prev, titulo: e.target.value }))} placeholder="Titulo del aviso" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
                <select value={avisoForm.rolDestino} onChange={(e) => setAvisoForm((prev) => ({ ...prev, rolDestino: e.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <option value="todos">Todos</option>
                  <option value="director">Directores</option>
                  <option value="especialista">Especialistas</option>
                  <option value="admin">Admins</option>
                </select>
                <textarea value={avisoForm.mensaje} onChange={(e) => setAvisoForm((prev) => ({ ...prev, mensaje: e.target.value }))} placeholder="Mensaje visible para los usuarios" rows={3} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 md:col-span-2" />
                <input type="datetime-local" value={avisoForm.visibleHasta} onChange={(e) => setAvisoForm((prev) => ({ ...prev, visibleHasta: e.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
                <button onClick={crearAviso} disabled={!avisoForm.titulo || !avisoForm.mensaje || savingKey === 'aviso'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"><Bell size={18} /> Publicar</button>
              </div>
              <div className="mt-4 max-h-52 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-700">
                {avisos.slice(0, 10).map((aviso) => (
                  <div key={aviso.id} className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 text-sm dark:border-slate-700">
                    <div>
                      <p className="font-black text-slate-800 dark:text-slate-100">{aviso.titulo}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{aviso.mensaje}</p>
                    </div>
                    <button onClick={() => toggleAviso(aviso)} className={`rounded-full px-3 py-1 text-xs font-black ${aviso.activo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`}>
                      {aviso.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-5 flex items-center gap-3">
              <ClipboardList className="text-blue-700 dark:text-blue-300" size={22} />
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Comprobantes</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Activa, desactiva o agrega tipos usados en ingresos y egresos.</p>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
              <input value={comprobanteNombre} onChange={(e) => setComprobanteNombre(e.target.value)} placeholder="Nuevo tipo de comprobante" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
              <button onClick={crearComprobante} disabled={!comprobanteNombre.trim() || savingKey === 'comprobante'} className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60">Agregar</button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {comprobantes.map((comprobante) => (
                <div key={comprobante.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{comprobante.nombre}</p>
                  <button onClick={() => toggleComprobante(comprobante)} className={`rounded-full px-3 py-1 text-xs font-black ${comprobante.activo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {comprobante.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-5 flex items-center gap-3">
              <KeyRound className="text-blue-700 dark:text-blue-300" size={22} />
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Credenciales</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Restablece contrasena y fuerza cambio al siguiente ingreso.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_260px_auto]">
              <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {usuarios.map((item) => <option key={item.id} value={item.id}>{item.nombre} | {item.email} | {item.rol}</option>)}
              </select>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva contrasena temporal" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
              <button onClick={resetPassword} disabled={!usuarioId || newPassword.length < 6 || savingKey === 'password'} className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60">Restablecer</button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default AdminControlView;
