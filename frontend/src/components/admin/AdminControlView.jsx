import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarClock,
  Gauge,
  KeyRound,
  Link2,
  Lock,
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
      const [summaryData, periodosData, institucionesData, especialistasData, usuariosData] = await Promise.all([
        fetchJson(buildApiUrl('/api/admin/resumen')),
        fetchJson(buildApiUrl(`/api/admin/periodos?anio=${anio}`)),
        fetchJson(buildApiUrl('/api/admin/instituciones')),
        fetchJson(buildApiUrl('/api/admin/especialistas')),
        fetchJson(buildApiUrl('/api/admin/usuarios'))
      ]);

      setSummary(summaryData.data);
      setPeriodos(periodosData.data || []);
      setInstituciones(institucionesData.data || []);
      setEspecialistas(especialistasData.data || []);
      setUsuarios(usuariosData.data || []);

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

  useEffect(() => {
    if (!selectedPeriodo) return;
    setPeriodoForm((prev) => ({
      ...prev,
      fechaLimite: toDateTimeLocal(selectedPeriodo.fechaLimite),
      descripcion: selectedPeriodo.descripcion || ''
    }));
  }, [selectedPeriodo]);

  const runAction = async (key, action, successMessage) => {
    setSavingKey(key);
    try {
      await action();
      showToast?.(successMessage || 'Operacion completada correctamente.');
      await loadData();
    } catch (error) {
      showToast?.(error.message, 'error');
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
    body: JSON.stringify({ directorId, anio, trimestre, accion })
  }), accion === 'cerrar' ? 'Trimestre cerrado por admin.' : 'Trimestre reabierto por admin.');

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
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
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
                  <button key={item.id} type="button" onClick={() => { setInstitucionForm(item); setInstitucionId(String(item.id)); if (item.director_id) setDirectorId(String(item.director_id)); }} className={`block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-900 ${institucionForm?.id === item.id ? 'bg-blue-50 dark:bg-slate-900' : ''}`}>
                    <p className="font-black text-slate-800 dark:text-slate-100">{item.numero || '-'} - {item.nombre}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Director: {item.director || 'Sin director'} | Especialistas: {item.especialistas || 'Sin asignar'}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
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
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
                <select value={institucionId} onChange={(e) => setInstitucionId(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {instituciones.map((item) => <option key={item.id} value={item.id}>{item.numero || '-'} - {item.nombre}</option>)}
                </select>
                <select value={especialistaId} onChange={(e) => setEspecialistaId(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {especialistas.map((item) => <option key={item.id} value={item.id}>{item.nombre || item.email}</option>)}
                </select>
                <button onClick={asignar} disabled={!institucionId || !especialistaId} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">Asignar</button>
              </div>
            </section>
          </div>

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
