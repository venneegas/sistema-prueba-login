import React from 'react';
import { AlertCircle, Building2, CheckCircle2, Inbox, Clock, Download, FileText, Loader2, PieChart } from 'lucide-react';
import EspecialistaPeriodoFilters from './EspecialistaPeriodoFilters';
import EspecialistaBarLineChart from './EspecialistaBarLineChart';

const EspecialistaReportesView = ({
  anioActual,
  aniosDisponibles,
  trimestreSeleccionado,
  onAnioChange,
  onTrimestreChange,
  stats,
  pctSubidos,
  pctAprobados,
  pctObservados,
  reporteGlobal,
  reporteLoading,
  reporteError
}) => {
  return (
    <>
      <header className="bg-white dark:bg-slate-800 shadow-sm px-8 py-5 flex items-center justify-between z-10 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          <PieChart className="text-blue-600" size={28} />
          Estadísticas Financieras
        </h1>
      </header>

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-8 py-4 flex justify-end">
        <EspecialistaPeriodoFilters
          anioActual={anioActual}
          aniosDisponibles={aniosDisponibles}
          trimestreSeleccionado={trimestreSeleccionado}
          onAnioChange={onAnioChange}
          onTrimestreChange={onTrimestreChange}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 group cursor-default">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <Building2 size={24} />
              </div>
              <div>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-0.5">Total Colegios</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 group cursor-default">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Recibidos Totales</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.subidos}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 group cursor-default">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                <Inbox size={24} />
              </div>
              <div>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider mb-0.5">Por Revisar</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.enviados}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 group cursor-default">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-slate-600 group-hover:text-white transition-colors duration-300">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">En Borrador</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.borradores}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
              <div className="relative w-32 h-32 mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-slate-100 dark:text-slate-700" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                  <circle
                    className="text-indigo-500 transition-all duration-1000 ease-out"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={(2 * Math.PI * 40) - (pctSubidos / 100) * (2 * Math.PI * 40)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="text-2xl font-bold text-slate-700 dark:text-slate-100">{pctSubidos}%</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Avance de Envios</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Instituciones que ya enviaron su declaracion ({stats.subidos} de {stats.total}).
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
              <div className="relative w-32 h-32 mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-slate-100 dark:text-slate-700" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                  <circle
                    className="text-emerald-500 transition-all duration-1000 ease-out"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={(2 * Math.PI * 40) - (pctAprobados / 100) * (2 * Math.PI * 40)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="text-2xl font-bold text-slate-700 dark:text-slate-100">{pctAprobados}%</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tasa de Aprobacion</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Reportes enviados que ya fueron aprobados ({stats.aprobados} de {stats.subidos}).
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
              <div className="relative w-32 h-32 mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-slate-100 dark:text-slate-700" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                  <circle
                    className="text-rose-500 transition-all duration-1000 ease-out"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={(2 * Math.PI * 40) - (pctObservados / 100) * (2 * Math.PI * 40)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="text-2xl font-bold text-slate-700 dark:text-slate-100">{pctObservados}%</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Indice de Observaciones</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Reportes enviados que presentaron inconsistencias ({stats.observados} de {stats.subidos}).
              </p>
            </div>
          </div>

          {reporteLoading ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-10 flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <Loader2 size={24} className="animate-spin text-blue-500" />
              <span className="font-medium">Cargando graficos financieros...</span>
            </div>
          ) : reporteError ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-rose-200 dark:border-rose-800 p-8 flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertCircle size={24} />
              <span className="font-medium">{reporteError}</span>
            </div>
          ) : reporteGlobal.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400">
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">No hay datos financieros para graficar</p>
              <p className="text-sm mt-2">Cuando los colegios registren ingresos y egresos en este periodo, apareceran aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <EspecialistaBarLineChart
                title="Ingresos Totales por Colegio"
                subtitle="Barras y linea comparativa del total de ingresos registrados por cada institucion del periodo."
                totalLabel="Ingreso general"
                colorClass="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                barColor="#10b981"
                lineColor="#065f46"
                data={reporteGlobal}
                dataKey="totalIngresos"
              />

              <EspecialistaBarLineChart
                title="Egresos Totales por Colegio"
                subtitle="Vista consolidada de los egresos registrados por cada institucion en el mismo periodo."
                totalLabel="Egreso general"
                colorClass="bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                barColor="#fb7185"
                lineColor="#be123c"
                data={reporteGlobal}
                dataKey="totalEgresos"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EspecialistaReportesView;