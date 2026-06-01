import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  WalletCards,
  XCircle
} from 'lucide-react';
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
  const [exportingReport, setExportingReport] = useState(null);

  const omisos = useMemo(
    () => reporteGlobal.filter((row) => (row.estado || 'Borrador').toLowerCase() === 'borrador'),
    [reporteGlobal]
  );

  const cuentasCorrientes = useMemo(() => {
    const conCuenta = reporteGlobal.filter((row) => String(row.numeroCuentaCorriente || '').trim().length > 0).length;
    return {
      conCuenta,
      sinCuenta: reporteGlobal.length - conCuenta
    };
  }, [reporteGlobal]);

  const reportes = [
    {
      id: 'consolidado',
      title: 'Reporte Consolidado Financiero',
      description: 'Exporta ingresos, egresos, saldo final y estado de auditoria de todas las instituciones del periodo.',
      icon: FileText,
      accent: 'blue',
      data: reporteGlobal,
      stats: [
        { label: 'Instituciones', value: reporteGlobal.length },
        { label: 'Periodo', value: `${trimestreSeleccionado}° trim. ${anioActual}` }
      ]
    },
    {
      id: 'omisos',
      title: 'Reporte de Omisos',
      description: 'Lista las instituciones que aun no enviaron su declaracion y permanecen como borrador en el periodo seleccionado.',
      icon: AlertTriangle,
      accent: 'amber',
      data: omisos,
      stats: [
        { label: 'Omisos', value: omisos.length },
        { label: 'Total colegios', value: reporteGlobal.length }
      ]
    },
    {
      id: 'cuentasCorrientes',
      title: 'Reporte de Cuentas Corrientes',
      description: 'Cruza las instituciones con el registro de tesoreria para identificar cuales tienen o no tienen cuenta corriente.',
      icon: WalletCards,
      accent: 'emerald',
      data: reporteGlobal,
      stats: [
        { label: 'Con cuenta', value: cuentasCorrientes.conCuenta },
        { label: 'Sin cuenta', value: cuentasCorrientes.sinCuenta }
      ]
    }
  ];

  const accentClasses = {
    blue: {
      panel: 'border-blue-200 dark:border-blue-900/70',
      icon: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300',
      button: 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-500/30'
    },
    amber: {
      panel: 'border-amber-200 dark:border-amber-900/70',
      icon: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
      button: 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500/30'
    },
    emerald: {
      panel: 'border-emerald-200 dark:border-emerald-900/70',
      icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
      button: 'bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500/30'
    }
  };

  const handleExportar = async (reporte) => {
    try {
      setExportingReport(reporte.id);
      await exportEspecialistaReporte({
        trimestreSeleccionado,
        anioActual,
        reporte: reporte.data,
        tipoReporte: reporte.id
      });
      if (showToast) showToast('Archivo Excel generado y descargado con exito.');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      if (showToast) {
        showToast('Ocurrio un error al generar el archivo Excel.', 'error');
      } else {
        alert('Ocurrio un error al generar el archivo Excel.');
      }
    } finally {
      setExportingReport(null);
    }
  };

  return (
    <>
      <header className="bg-white dark:bg-slate-800 shadow-sm px-8 py-5 flex items-center justify-between z-10 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          <FileSpreadsheet className="text-blue-600" size={28} />
          Reportes y Exportacion
        </h1>
      </header>

      <div className="bg-white dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-8 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Periodo de reporte</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Selecciona el trimestre antes de descargar los archivos.</p>
        </div>
        <EspecialistaPeriodoFilters
          anioActual={anioActual}
          aniosDisponibles={aniosDisponibles}
          trimestreSeleccionado={trimestreSeleccionado}
          onAnioChange={onAnioChange}
          onTrimestreChange={onTrimestreChange}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto space-y-6">
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {reportes.map((reporte) => {
              const Icon = reporte.icon;
              const classes = accentClasses[reporte.accent];
              const isExporting = exportingReport === reporte.id;
              const disabled = reporteLoading || isExporting || reporteGlobal.length === 0;

              return (
                <article
                  key={reporte.id}
                  className={`bg-white dark:bg-slate-800 rounded-2xl border ${classes.panel} shadow-sm p-6 flex flex-col min-h-[320px]`}
                >
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${classes.icon}`}>
                      <Icon size={24} />
                    </div>
                    {reporte.id === 'cuentasCorrientes' && (
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 size={14} />
                          {cuentasCorrientes.conCuenta}
                        </span>
                        <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-300">
                          <XCircle size={14} />
                          {cuentasCorrientes.sinCuenta}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{reporte.title}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{reporte.description}</p>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                      {reporte.stats.map((stat) => (
                        <div key={stat.label} className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-3">
                          <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">{stat.label}</p>
                          <p className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleExportar(reporte)}
                    disabled={disabled}
                    className={`mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl font-bold text-sm transition-all shadow-sm focus:outline-none focus:ring-4 disabled:opacity-60 disabled:cursor-not-allowed ${classes.button}`}
                  >
                    {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    {isExporting ? 'Generando...' : 'Exportar Excel'}
                  </button>
                </article>
              );
            })}
          </section>

          {reporteLoading ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <Loader2 size={24} className="animate-spin text-blue-500" />
              <span className="font-medium">Cargando datos para los reportes...</span>
            </div>
          ) : reporteGlobal.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200">No hay instituciones para el periodo seleccionado</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Cuando existan registros disponibles, los reportes se podran exportar desde aqui.</p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default ReportesView;
