import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
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
import EspecialistaPageHeader from './EspecialistaPageHeader';
import { isEstadoPendiente } from '../../utils/estadoReporte';

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
    () => reporteGlobal.filter((row) => isEstadoPendiente(row.estado)),
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
      description: 'Exporta ingresos, egresos, saldo final y estado de auditoría de todas las instituciones del periodo.',
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
      description: 'Lista las instituciones que aun no enviaron su declaracion y permanecen como pendientes en el periodo seleccionado.',
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
      description: 'Cruza las instituciones con el registro de tesorería para identificar cuales tienen o no tienen cuenta corriente.',
      icon: WalletCards,
      accent: 'emerald',
      data: reporteGlobal,
      stats: [
        { label: 'Con cuenta', value: cuentasCorrientes.conCuenta },
        { label: 'Sin cuenta', value: cuentasCorrientes.sinCuenta }
      ]
    },
    {
      id: 'rankingRecaudacion',
      title: 'Ranking de Recaudación',
      description: 'Exporta los rankings descendentes de ingresos y egresos del periodo, ordenados por institución educativa.',
      icon: BarChart3,
      accent: 'indigo',
      data: reporteGlobal,
      stats: [
        { label: 'Ranking', value: 'Ingresos' },
        { label: 'Ranking', value: 'Egresos' }
      ]
    }
  ];

  const accentClasses = {
    blue: {
      border: 'border-l-blue-600',
      icon: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      stat: 'bg-blue-50/70 border-blue-100 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300/30'
    },
    amber: {
      border: 'border-l-amber-500',
      icon: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
      stat: 'bg-amber-50/70 border-amber-100 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200',
      button: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-300/40'
    },
    emerald: {
      border: 'border-l-emerald-600',
      icon: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
      stat: 'bg-emerald-50/70 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200',
      button: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-300/30'
    },
    indigo: {
      border: 'border-l-indigo-600',
      icon: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
      stat: 'bg-indigo-50/70 border-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-200',
      button: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-300/30'
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
      <EspecialistaPageHeader
        icon={FileSpreadsheet}
        title="Reportes y Exportacion"
        subtitle="Selecciona el periodo y descarga archivos Excel para seguimiento institucional."
        actions={(
          <EspecialistaPeriodoFilters
            anioActual={anioActual}
            aniosDisponibles={aniosDisponibles}
            trimestreSeleccionado={trimestreSeleccionado}
            onAnioChange={onAnioChange}
            onTrimestreChange={onTrimestreChange}
          />
        )}
      />

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto space-y-6">
          <section className="space-y-5">
            {reportes.map((reporte) => {
              const Icon = reporte.icon;
              const classes = accentClasses[reporte.accent];
              const isExporting = exportingReport === reporte.id;
              const disabled = reporteLoading || isExporting || reporteGlobal.length === 0;

              return (
                <article
                  key={reporte.id}
                  className={`rounded-2xl border border-l-4 ${classes.border} border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 md:p-7`}
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start">
                      <div className={`w-14 h-14 rounded-2xl border flex flex-shrink-0 items-center justify-center ${classes.icon}`}>
                        <Icon size={28} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                          <h2 className="text-xl font-black leading-tight text-slate-900 dark:text-slate-100 md:text-2xl">{reporte.title}</h2>
                          {reporte.id === 'cuentasCorrientes' && (
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800">
                                <CheckCircle2 size={14} />
                                {cuentasCorrientes.conCuenta}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-rose-700 ring-1 ring-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800">
                                <XCircle size={14} />
                                {cuentasCorrientes.sinCuenta}
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">
                          {reporte.description}
                        </p>

                        <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-md">
                          {reporte.stats.map((stat) => (
                            <div key={stat.label} className={`rounded-xl border px-4 py-3 ${classes.stat}`}>
                              <p className="text-[11px] uppercase tracking-wider font-bold opacity-70">{stat.label}</p>
                              <p className="mt-1 text-xl font-black">{stat.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleExportar(reporte)}
                      disabled={disabled}
                      className={`w-full lg:w-auto lg:min-w-[190px] flex items-center justify-center gap-2 px-6 py-3.5 text-white rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${classes.button}`}
                    >
                      {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                      {isExporting ? 'Generando...' : 'Exportar Excel'}
                    </button>
                  </div>
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
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Cuando existan registros disponibles, los reportes se podran exportar desde aquí.</p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default ReportesView;

