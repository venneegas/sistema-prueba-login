import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Database,
  Download,
  Loader2,
  RefreshCw,
  Search
} from 'lucide-react';
import { buildApiUrl } from '../../config/api';
import EspecialistaPageHeader from './EspecialistaPageHeader';
import EspecialistaPeriodoFilters from './EspecialistaPeriodoFilters';

const money = (value) => `S/ ${Number(value || 0).toLocaleString('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;

const csvEscape = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const EspecialistaDatasetMLView = ({
  anioActual,
  aniosDisponibles,
  trimestreSeleccionado,
  onAnioChange,
  onTrimestreChange,
  showToast
}) => {
  const [dataset, setDataset] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargarDataset = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        buildApiUrl(`/api/especialista/ml/dataset?anio=${anioActual}&trimestre=${trimestreSeleccionado}`),
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo cargar el dataset.');
      }

      setDataset(data.dataset || []);
      setMeta(data.meta || null);
    } catch (err) {
      setError(err.message);
      setDataset([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [anioActual, trimestreSeleccionado]);

  useEffect(() => {
    cargarDataset();
  }, [cargarDataset]);

  const filasFiltradas = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return dataset;

    return dataset.filter((row) => (
      String(row.institucion || '').toLowerCase().includes(term)
      || String(row.codigo_modular || '').toLowerCase().includes(term)
      || String(row.numero_ie || '').toLowerCase().includes(term)
    ));
  }, [busqueda, dataset]);

  const exportarCSV = () => {
    if (dataset.length === 0) {
      showToast?.('No hay filas para exportar.', 'error');
      return;
    }

    const headers = Object.keys(dataset[0]);
    const rows = dataset.map((row) => headers.map((key) => csvEscape(row[key])).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dataset_isolation_forest_T${trimestreSeleccionado}_${anioActual}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const completitud = meta?.total_filas
    ? Math.round((Number(meta.filas_completas || 0) / Number(meta.total_filas || 1)) * 100)
    : 0;

  return (
    <>
      <EspecialistaPageHeader
        icon={Database}
        title="Dataset ML"
        subtitle="Revisa la completitud del dataset antes de entrenar Isolation Forest."
        actions={(
          <>
            <EspecialistaPeriodoFilters
              anioActual={anioActual}
              aniosDisponibles={aniosDisponibles}
              trimestreSeleccionado={trimestreSeleccionado}
              onAnioChange={onAnioChange}
              onTrimestreChange={onTrimestreChange}
            />
            <button
              type="button"
              onClick={cargarDataset}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
              Actualizar
            </button>
            <button
              type="button"
              onClick={exportarCSV}
              disabled={dataset.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Download size={18} />
              CSV
            </button>
          </>
        )}
      />

      <div className="flex-1 overflow-y-auto bg-slate-50/70 p-8 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
            {[
              ['Total filas', meta?.total_filas || 0],
              ['Completas', meta?.filas_completas || 0],
              ['Incompletas', meta?.filas_incompletas || 0],
              ['Completitud', `${completitud}%`]
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className={`rounded-2xl border p-5 ${
            meta?.listo_para_entrenamiento
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
              : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'
          }`}>
            <div className="flex items-center gap-3">
              {meta?.listo_para_entrenamiento ? <CheckCircle size={22} /> : <AlertTriangle size={22} />}
              <p className="font-bold">
                {meta?.listo_para_entrenamiento
                  ? 'Dataset listo para entrenamiento.'
                  : 'Dataset aún no listo para entrenamiento: revisa filas incompletas.'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar por I.E., código modular o número..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-blue-900/40"
              />
            </label>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                    <th className="p-4 font-bold">Institución</th>
                    <th className="p-4 font-bold text-right">Inicial</th>
                    <th className="p-4 font-bold text-right">Ingresos</th>
                    <th className="p-4 font-bold text-right">Egresos</th>
                    <th className="p-4 font-bold text-right">Caja</th>
                    <th className="p-4 font-bold text-right">Banco</th>
                    <th className="p-4 font-bold text-right">Saldo final</th>
                    <th className="p-4 font-bold text-center">Manual</th>
                    <th className="p-4 font-bold text-center">Completo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="p-10 text-center text-slate-500">
                        <Loader2 size={28} className="mx-auto mb-3 animate-spin text-blue-500" />
                        Cargando dataset...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="9" className="p-10 text-center font-semibold text-rose-600">{error}</td>
                    </tr>
                  ) : filasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="p-10 text-center text-slate-500">No hay filas para mostrar.</td>
                    </tr>
                  ) : filasFiltradas.map((row) => (
                    <tr key={row.director_id} className="text-sm hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-4">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{row.institucion}</p>
                        <p className="mt-1 text-xs text-slate-500">IE {row.numero_ie || '-'} | {row.codigo_modular || '-'}</p>
                      </td>
                      <td className="p-4 text-right font-mono">{money(row.saldo_inicial)}</td>
                      <td className="p-4 text-right font-mono">{money(row.total_ingresos)}</td>
                      <td className="p-4 text-right font-mono">{money(row.total_egresos)}</td>
                      <td className="p-4 text-right font-mono">{money(row.dinero_en_caja)}</td>
                      <td className="p-4 text-right font-mono">{money(row.dinero_en_banco)}</td>
                      <td className="p-4 text-right font-mono font-bold">{money(row.saldo_final)}</td>
                      <td className="p-4 text-center">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.carga_manual ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                          {row.carga_manual ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.dataset_completo ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {row.dataset_completo ? 'Completo' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EspecialistaDatasetMLView;
