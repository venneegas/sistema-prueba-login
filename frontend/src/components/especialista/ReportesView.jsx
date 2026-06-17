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
      description: 'Lista las instituciones que aún no enviaron su declaración y permanecen como pendientes en el periodo seleccionado.',
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
      card: 'from-blue-950 via-blue-900 to-blue-800',
      icon: 'bg-blue-400/15 text-blue-100 ring-blue-300/20',
      stat: 'bg-blue-950/35 ring-blue-300/10',
      button: 'bg-blue-500 hover:bg-blue-400 focus:ring-blue-300/30',
      decoration: 'bg-blue-400/10'
    },
    amber: {
      card: 'from-amber-950 via-orange-950 to-slate-950',
      icon: 'bg-amber-400/15 text-amber-100 ring-amber-300/20',
      stat: 'bg-slate-950/35 ring-amber-300/10',
      button: 'bg-amber-500 hover:bg-amber-400 focus:ring-amber-300/40',
      decoration: 'bg-amber-400/10'
    },
    emerald: {
      card: 'from-emerald-950 via-teal-950 to-slate-950',
      icon: 'bg-emerald-400/15 text-emerald-100 ring-emerald-300/20',
      stat: 'bg-slate-950/35 ring-emerald-300/10',
      button: 'bg-emerald-500 hover:bg-emerald-400 focus:ring-emerald-300/30',
      decoration: 'bg-emerald-400/10'
    },
    indigo: {
      card: 'from-indigo-950 via-violet-950 to-slate-950',
      icon: 'bg-indigo-400/15 text-indigo-100 ring-indigo-300/20',
      stat: 'bg-slate-950/35 ring-indigo-300/10',
      button: 'bg-indigo-500 hover:bg-indigo-400 focus:ring-indigo-300/30',
      decoration: 'bg-indigo-400/10'
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
      if (showToast) showToast('Archivo Excel generado y descargado con éxito.');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      if (showToast) {
        showToast('Ocurrió un error al generar el archivo Excel.', 'error');
      } else {
        alert('Ocurrió un error al generar el archivo Excel.');
      }
    } finally {
      setExportingReport(null);
    }
  };

  return (
    <>
      <EspecialistaPageHeader
        icon={FileSpreadsheet}
        title="Reportes y Exportación"
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
                  className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${classes.card} p-6 text-white shadow-sm ring-1 ring-white/10 md:p-7`}
                >
                  <div className={`pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full ${classes.decoration}`} />
                  <div className={`pointer-events-none absolute right-8 top-3 h-20 w-20 rounded-full ${classes.decoration}`} />
                  <div className={`pointer-events-none absolute -right-8 bottom-6 h-24 w-40 rounded-full ${classes.decoration}`} />

                  <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start">
                      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ring-1 ${classes.icon}`}>
                        <Icon size={24} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                          <h2 className="text-lg font-black leading-tight text-white md:text-xl">{reporte.title}</h2>
                          {reporte.id === 'cuentasCorrientes' && (
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-emerald-100 ring-1 ring-white/15">
                                <CheckCircle2 size={14} />
                                {cuentasCorrientes.conCuenta}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-slate-100 ring-1 ring-white/15">
                                <XCircle size={14} />
                                {cuentasCorrientes.sinCuenta}
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/75">
                          {reporte.description}
                        </p>

                        <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-md">
                          {reporte.stats.map((stat) => (
                            <div key={stat.label} className={`rounded-lg px-4 py-3 ring-1 ${classes.stat}`}>
                              <p className="text-[10px] uppercase tracking-wider font-bold text-white/55">{stat.label}</p>
                              <p className="mt-1 text-base font-black text-white">{stat.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleExportar(reporte)}
                      disabled={disabled}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-slate-950/15 transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-4 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto lg:min-w-[170px] ${classes.button}`}
                    >
                      {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
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
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Cuando existan registros disponibles, los reportes se podrán exportar desde aquí.</p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default ReportesView;

