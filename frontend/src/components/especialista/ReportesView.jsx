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
      description: 'Lista las instituciones que aún no enviaron su declaración y permanecen como borrador en el periodo seleccionado.',
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
      panel: 'from-blue-900 to-blue-950',
      icon: 'bg-blue-500/20 text-blue-100 border-blue-300/20',
      stat: 'bg-blue-950/50 border-blue-300/15 text-blue-50',
      ghost: 'text-blue-800/30',
      button: 'bg-blue-500 hover:bg-blue-400 focus:ring-blue-300/30'
    },
    amber: {
      panel: 'from-amber-800 to-slate-950',
      icon: 'bg-amber-500/20 text-amber-100 border-amber-300/20',
      stat: 'bg-slate-950/45 border-amber-300/15 text-amber-50',
      ghost: 'text-amber-700/25',
      button: 'bg-amber-500 hover:bg-amber-400 focus:ring-amber-300/30'
    },
    emerald: {
      panel: 'from-emerald-800 to-slate-950',
      icon: 'bg-emerald-500/20 text-emerald-100 border-emerald-300/20',
      stat: 'bg-slate-950/45 border-emerald-300/15 text-emerald-50',
      ghost: 'text-emerald-700/25',
      button: 'bg-emerald-500 hover:bg-emerald-400 focus:ring-emerald-300/30'
    },
    indigo: {
      panel: 'from-indigo-900 to-slate-950',
      icon: 'bg-indigo-500/20 text-indigo-100 border-indigo-300/20',
      stat: 'bg-slate-950/45 border-indigo-300/15 text-indigo-50',
      ghost: 'text-indigo-700/25',
      button: 'bg-indigo-500 hover:bg-indigo-400 focus:ring-indigo-300/30'
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
          Reportes y Exportación
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
          <section className="space-y-5">
            {reportes.map((reporte) => {
              const Icon = reporte.icon;
              const classes = accentClasses[reporte.accent];
              const isExporting = exportingReport === reporte.id;
              const disabled = reporteLoading || isExporting || reporteGlobal.length === 0;

              return (
                <article
                  key={reporte.id}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${classes.panel} p-6 md:p-8 shadow-md text-white`}
                >
                  <Icon size={220} className={`absolute -right-10 -top-16 ${classes.ghost}`} />

                  <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start">
                      <div className={`w-14 h-14 rounded-2xl border flex flex-shrink-0 items-center justify-center ${classes.icon}`}>
                        <Icon size={28} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                          <h2 className="text-xl md:text-2xl font-black leading-tight">{reporte.title}</h2>
                          {reporte.id === 'cuentasCorrientes' && (
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-emerald-100 ring-1 ring-white/15">
                                <CheckCircle2 size={14} />
                                {cuentasCorrientes.conCuenta}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-rose-100 ring-1 ring-white/15">
                                <XCircle size={14} />
                                {cuentasCorrientes.sinCuenta}
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="mt-2 max-w-3xl text-sm md:text-base leading-relaxed text-white/80">
                          {reporte.description}
                        </p>

                        <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-md">
                          {reporte.stats.map((stat) => (
                            <div key={stat.label} className={`rounded-xl border px-4 py-3 ${classes.stat}`}>
                              <p className="text-[11px] uppercase tracking-wider font-bold text-white/55">{stat.label}</p>
                              <p className="mt-1 text-xl font-black">{stat.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleExportar(reporte)}
                      disabled={disabled}
                      className={`w-full lg:w-auto lg:min-w-[190px] flex items-center justify-center gap-2 px-6 py-4 text-white rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${classes.button}`}
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
