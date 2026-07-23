import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Database,
  Download,
  Eye,
  GitBranch,
  HardDrive,
  KeyRound,
  RefreshCw,
  Rows3,
  Search,
  ShieldAlert,
  Table2
} from 'lucide-react';
import { buildApiUrl } from '../../config/api';
import AdminPageHeader from './AdminPageHeader';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatValue = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (value instanceof Date) return formatDate(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const DatabaseView = ({ showToast }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [overview, setOverview] = useState({ database: '', tables: [], relations: [] });
  const [selectedTable, setSelectedTable] = useState('');
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    setError('');

    try {
      const response = await fetch(buildApiUrl('/api/admin/schema'), {
        headers: authHeaders()
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'No se pudo cargar el esquema.');
      }

      setOverview(result.data);
      setSelectedTable((current) => current || result.data.tables?.[0]?.nombre || '');
    } catch (loadError) {
      console.error('Error cargando esquema:', loadError);
      setError(loadError.message || 'Error cargando esquema.');
      showToast(loadError.message || 'Error cargando esquema.', 'error');
    } finally {
      setLoadingOverview(false);
    }
  }, [showToast]);

  const loadTableDetail = useCallback(async (tableName) => {
    if (!tableName) {
      setDetail(null);
      return;
    }

    setLoadingDetail(true);
    setError('');

    try {
      const response = await fetch(buildApiUrl(`/api/admin/schema/${encodeURIComponent(tableName)}?limit=25`), {
        headers: authHeaders()
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'No se pudo cargar la tabla.');
      }

      setDetail(result.data);
    } catch (loadError) {
      console.error('Error cargando detalle de tabla:', loadError);
      setError(loadError.message || 'Error cargando detalle de tabla.');
      showToast(loadError.message || 'Error cargando detalle de tabla.', 'error');
    } finally {
      setLoadingDetail(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadTableDetail(selectedTable);
  }, [loadTableDetail, selectedTable]);

  const filteredTables = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return overview.tables;
    return overview.tables.filter((table) => table.nombre.toLowerCase().includes(term));
  }, [overview.tables, search]);

  const totals = useMemo(() => ({
    tables: overview.tables.length,
    columns: overview.tables.reduce((sum, table) => sum + Number(table.totalColumnas || 0), 0),
    relations: overview.relations.length
  }), [overview]);

  const sampleColumns = useMemo(() => {
    if (!detail?.sampleRows?.length) return [];
    return Object.keys(detail.sampleRows[0]);
  }, [detail]);

  const handleDownloadBackup = async () => {
    setIsDownloading(true);

    try {
      const response = await fetch(buildApiUrl('/api/admin/backup'), {
        headers: authHeaders()
      });

      if (!response.ok) throw new Error('No se pudo generar el archivo de base de datos.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `UGEL_Database_Backup_${new Date().toISOString().slice(0, 10)}.sql`;
      a.click();
      window.URL.revokeObjectURL(url);

      showToast('Copia de seguridad descargada con exito.');
    } catch (downloadError) {
      console.error('Error descargando backup:', downloadError);
      showToast(`Error: ${downloadError.message}`, 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        icon={HardDrive}
        title="Visor de Base de Datos"
        subtitle="Consulta dinamica del esquema, columnas, llaves y relaciones registradas en MySQL."
        actions={(
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={loadOverview}
              disabled={loadingOverview}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <RefreshCw size={18} className={loadingOverview ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-60"
            >
              {isDownloading ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
              Descargar .SQL
            </button>
          </div>
        )}
      />

      <div className="flex-1 overflow-y-auto bg-slate-50 p-8 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Base</p>
              <p className="mt-2 truncate text-xl font-black text-slate-900 dark:text-white">{overview.database || '-'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Tablas</p>
              <p className="mt-2 text-xl font-black text-blue-700 dark:text-blue-300">{totals.tables}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Columnas</p>
              <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">{totals.columns}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Relaciones</p>
              <p className="mt-2 text-xl font-black text-emerald-700 dark:text-emerald-300">{totals.relations}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <span>Vista de solo lectura. Las muestras se limitan a 25 filas y los campos sensibles se muestran enmascarados.</span>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}

          <div className="grid min-h-[620px] gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="border-b border-slate-100 p-5 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Table2 size={20} className="text-blue-700 dark:text-blue-300" />
                  <h2 className="text-base font-black text-slate-900 dark:text-white">Tablas</h2>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                  <Search size={17} className="text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar tabla"
                    className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="max-h-[520px] overflow-y-auto p-3">
                {loadingOverview ? (
                  <div className="p-6 text-center text-sm font-bold text-slate-500 dark:text-slate-400">Cargando tablas...</div>
                ) : filteredTables.length === 0 ? (
                  <div className="p-6 text-center text-sm font-bold text-slate-500 dark:text-slate-400">Sin coincidencias.</div>
                ) : (
                  filteredTables.map((table) => {
                    const isActive = selectedTable === table.nombre;

                    return (
                      <button
                        key={table.nombre}
                        type="button"
                        onClick={() => setSelectedTable(table.nombre)}
                        className={`mb-2 w-full rounded-xl border p-4 text-left transition ${
                          isActive
                            ? 'border-blue-200 bg-blue-50 shadow-sm dark:border-blue-500/40 dark:bg-blue-500/10'
                            : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className={`truncate text-sm font-black ${isActive ? 'text-blue-800 dark:text-blue-200' : 'text-slate-800 dark:text-slate-100'}`}>
                            {table.nombre}
                          </p>
                          <ArrowRight size={16} className={isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-300'} />
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          <span>{table.totalColumnas} cols</span>
                          <span>{table.filasEstimadas} filas</span>
                          <span>{table.relacionesSalientes + table.relacionesEntrantes} rel.</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section className="min-w-0 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between dark:border-slate-800">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">Tabla seleccionada</p>
                    <h2 className="mt-1 truncate text-2xl font-black text-slate-900 dark:text-white">
                      {selectedTable || 'Sin tabla'}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-900">
                      <Rows3 size={17} />
                      {detail?.table?.filasEstimadas ?? 0} filas estimadas
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-900">
                      <Eye size={17} />
                      {detail?.sampleRows?.length ?? 0} filas visibles
                    </span>
                  </div>
                </div>

                {loadingDetail ? (
                  <div className="p-8 text-center text-sm font-bold text-slate-500 dark:text-slate-400">Cargando detalle...</div>
                ) : (
                  <div className="p-6">
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                        <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                          <tr>
                            <th className="px-4 py-3 text-left">Columna</th>
                            <th className="px-4 py-3 text-left">Tipo</th>
                            <th className="px-4 py-3 text-left">Llave</th>
                            <th className="px-4 py-3 text-left">Null</th>
                            <th className="px-4 py-3 text-left">Extra</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {(detail?.columns || []).map((column) => (
                            <tr key={column.nombre} className="text-slate-700 dark:text-slate-200">
                              <td className="px-4 py-3 font-black">
                                <span className="inline-flex items-center gap-2">
                                  {column.llave === 'PRI' && <KeyRound size={15} className="text-amber-500" />}
                                  {column.nombre}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-xs">{column.tipo}</td>
                              <td className="px-4 py-3">{column.llave || '-'}</td>
                              <td className="px-4 py-3">{column.permite_null === 'YES' ? 'Si' : 'No'}</td>
                              <td className="px-4 py-3">{column.extra || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                  <div className="mb-4 flex items-center gap-3">
                    <GitBranch size={20} className="text-emerald-700 dark:text-emerald-300" />
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Relaciones salientes</h3>
                  </div>
                  {(detail?.outgoingRelations || []).length === 0 ? (
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No registra llaves foraneas hacia otras tablas.</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.outgoingRelations.map((relation) => (
                        <div key={`${relation.restriccion}-${relation.columna}`} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
                          <p className="font-black text-slate-800 dark:text-slate-100">{relation.columna}</p>
                          <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
                            {relation.tabla_referenciada}.{relation.columna_referenciada}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                  <div className="mb-4 flex items-center gap-3">
                    <Database size={20} className="text-blue-700 dark:text-blue-300" />
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Relaciones entrantes</h3>
                  </div>
                  {(detail?.incomingRelations || []).length === 0 ? (
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ninguna tabla apunta a esta tabla.</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.incomingRelations.map((relation) => (
                        <div key={`${relation.restriccion}-${relation.tabla}-${relation.columna}`} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
                          <p className="font-black text-slate-800 dark:text-slate-100">{relation.tabla}.{relation.columna}</p>
                          <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
                            apunta a {selectedTable}.{relation.columna_referenciada}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="border-b border-slate-100 p-6 dark:border-slate-800">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Muestra de registros</h3>
                </div>
                <div className="overflow-x-auto p-6">
                  {sampleColumns.length === 0 ? (
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No hay registros para mostrar.</p>
                  ) : (
                    <table className="min-w-full divide-y divide-slate-200 text-xs dark:divide-slate-800">
                      <thead className="bg-slate-50 font-black uppercase tracking-[0.1em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                        <tr>
                          {sampleColumns.map((column) => (
                            <th key={column} className="max-w-[220px] px-3 py-3 text-left">{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {detail.sampleRows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="text-slate-700 dark:text-slate-200">
                            {sampleColumns.map((column) => (
                              <td key={column} className="max-w-[220px] truncate px-3 py-3 font-mono" title={formatValue(row[column])}>
                                {formatValue(row[column])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default DatabaseView;
