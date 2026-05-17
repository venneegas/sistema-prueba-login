import React, { useState } from 'react';
import { FileSpreadsheet, Search, Filter, Download, Info, FileText, Loader2 } from 'lucide-react';
import EspecialistaPeriodoFilters from './EspecialistaPeriodoFilters';
import exportEspecialistaReporte from '../../utils/exportEspecialistaReporte';

const ReportesView = ({
  anioActual,
  aniosDisponibles,
  trimestreSeleccionado,
  onAnioChange,
  onTrimestreChange,
  reporteGlobal,
  reporteLoading,
  showToast
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    busqueda: ''
  });

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Aprobado': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Enviado': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Observado': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Borrador': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Filtrar data
  const previewData = reporteGlobal.filter(row => {
    const matchBusqueda = (row.nombre || '').toLowerCase().includes(filtros.busqueda.toLowerCase()) || 
                          (row.codigoModular || '').includes(filtros.busqueda);
    const matchEstado = filtros.estado === 'todos' || 
                        (row.estado || 'Borrador').toLowerCase() === filtros.estado.toLowerCase();
    return matchBusqueda && matchEstado;
  });

  const handleExportar = async () => {
    try {
      setIsExporting(true);
      // Importante: Pasamos "previewData" en lugar de "reporteGlobal" para respetar los filtros
      await exportEspecialistaReporte({
        trimestreSeleccionado,
        anioActual,
        reporte: previewData
      });
      if (showToast) showToast('Archivo Excel generado y descargado con éxito.');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      if (showToast) {
        showToast('Ocurrió un error al generar el archivo Excel.', 'error');
      } else {
        alert('Ocurrió un error al generar el archivo Excel.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm px-8 py-5 flex items-center justify-between z-10 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <FileSpreadsheet className="text-blue-600" size={28} />
          Reportes y Exportación
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* PANEL AZUL DE EXPORTACIÓN */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-950 p-8 md:p-10 rounded-2xl shadow-md text-white flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
            <div className="absolute -right-12 -top-24 text-blue-800/30">
              <FileText size={250} />
            </div>
            <div className="relative z-10 mb-6 md:mb-0 md:pr-8 text-center md:text-left flex-1">
              <h3 className="text-2xl font-bold mb-3 flex items-center justify-center md:justify-start gap-3">
                <Download className="text-blue-300" size={28} />
                Reporte Consolidado Financiero
              </h3>
              <p className="text-blue-100 text-sm md:text-base max-w-3xl leading-relaxed">
                Descarga la sábana de datos maestra en formato Excel (.xlsx). Incluye el estado actual de auditoría,
                totales declarados de ingresos y egresos, y el saldo final bancario de todas las instituciones educativas
                correspondientes al {trimestreSeleccionado}° trimestre del {anioActual}.
              </p>
            </div>
            <div className="relative z-10 w-full md:w-auto flex-shrink-0">
              <button
                onClick={handleExportar}
                disabled={isExporting || previewData.length === 0}
                className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isExporting ? <Loader2 size={24} className="animate-spin" /> : <FileSpreadsheet size={24} />}
                {isExporting ? 'Generando Archivo...' : 'Exportar a Excel'}
              </button>
            </div>
          </div>

          {/* SECCIÓN DE FILTROS */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-700 pb-4">
              <Filter size={20} className="text-slate-400" />
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">Filtros de Vista Previa</h2>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-auto">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Periodo</label>
                <EspecialistaPeriodoFilters
                  anioActual={anioActual}
                  aniosDisponibles={aniosDisponibles}
                  trimestreSeleccionado={trimestreSeleccionado}
                  onAnioChange={onAnioChange}
                  onTrimestreChange={onTrimestreChange}
                />
              </div>

              <div className="w-full md:w-1/4">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Estado</label>
                <select 
                  value={filtros.estado} onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="aprobado">Aprobados</option>
                  <option value="enviado">Enviados</option>
                  <option value="observado">Observados</option>
                  <option value="borrador">Borradores</option>
                </select>
              </div>

              <div className="w-full md:flex-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Buscar Colegio</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre o código modular..." 
                    value={filtros.busqueda} onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* VISTA PREVIA (PREVIEW TABLE) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Info size={18} className="text-blue-500" />
                Vista Previa de la Sábana de Datos
              </h3>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md">
                {previewData.length} registros
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse relative">
                <thead>
                  <tr className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold">Institución</th>
                    <th className="p-4 font-bold text-right">Ingresos</th>
                    <th className="p-4 font-bold text-right">Egresos</th>
                    <th className="p-4 font-bold text-right">Saldo Final</th>
                    <th className="p-4 font-bold text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {reporteLoading ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">
                        <Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-500" />
                        Cargando datos...
                      </td>
                    </tr>
                  ) : previewData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">No hay datos que coincidan con los filtros actuales.</td>
                    </tr>
                  ) : (
                    previewData.map((row) => (
                      <tr key={row.directorId || row.codigoModular} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{row.nombre}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">Cod: {row.codigoModular}</div>
                        </td>
                        <td className="p-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          S/ {Number(row.totalIngresos || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-right font-medium text-rose-600 dark:text-rose-400">
                          S/ {Number(row.totalEgresos || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-right font-bold text-slate-700 dark:text-slate-300">
                          S/ {Number(row.saldoTotal || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold border ${getEstadoBadge(row.estado || 'Borrador')}`}>
                            {row.estado || 'Borrador'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default ReportesView;