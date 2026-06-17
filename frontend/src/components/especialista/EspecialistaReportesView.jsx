import React, { useMemo } from 'react';
import { AlertCircle, Building2, CheckCircle2, Inbox, Clock, Loader2, PieChart, TrendingDown, TrendingUp } from 'lucide-react';
import EspecialistaPeriodoFilters from './EspecialistaPeriodoFilters';
import EspecialistaPageHeader from './EspecialistaPageHeader';

const formatCurrency = (value) => Number(value || 0).toLocaleString('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const RankingCard = ({ title, subtitle, data, dataKey, icon: Icon, tone }) => {
  const maxValue = Math.max(...data.map((item) => Number(item[dataKey] || 0)), 0);
  const toneClasses = {
    emerald: {
      icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      bar: 'bg-emerald-500',
      amount: 'text-emerald-600 dark:text-emerald-400'
    },
    rose: {
      icon: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
      bar: 'bg-rose-500',
      amount: 'text-rose-600 dark:text-rose-400'
    }
  };
  const classes = toneClasses[tone];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/40 flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${classes.icon}`}>
          <Icon size={22} />
        </div>
        <div>
          <h3 className="font-black text-slate-800 dark:text-slate-100">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700/70">
        {data.map((item, index) => {
          const amount = Number(item[dataKey] || 0);
          const width = maxValue > 0 ? Math.max((amount / maxValue) * 100, 4) : 4;

          return (
            <div key={`${item.codigoModular || item.directorId}-${dataKey}`} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-sm font-black flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{item.nombre || 'Institucion sin nombre'}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{item.codigoModular || '-'}</p>
                  </div>
                </div>
                <p className={`text-sm font-black whitespace-nowrap ${classes.amount}`}>S/ {formatCurrency(amount)}</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div className={`h-full rounded-full ${classes.bar}`} style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
  const rankingIngresos = useMemo(
    () => [...reporteGlobal].sort((a, b) => Number(b.totalIngresos || 0) - Number(a.totalIngresos || 0)).slice(0, 10),
    [reporteGlobal]
  );

  const rankingEgresos = useMemo(
    () => [...reporteGlobal].sort((a, b) => Number(b.totalEgresos || 0) - Number(a.totalEgresos || 0)).slice(0, 10),
    [reporteGlobal]
  );

  return (
    <>
      <EspecialistaPageHeader
        icon={PieChart}
        title="Estadísticas Financieras"
        subtitle="Indicadores de avance, aprobación y ranking financiero por institución educativa."
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

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Building2 size={24} />
              </div>
              <div>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-0.5">Total Colegios</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Recibidos Totales</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.subidos}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Inbox size={24} />
              </div>
              <div>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider mb-0.5">Por Revisar</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.enviados}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">Pendientes</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.pendientes}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 p-7 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
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
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Avance de Envíos</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Instituciones que ya enviaron su declaración ({stats.subidos} de {stats.total}).
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-7 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
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
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tasa de Aprobación</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Reportes enviados que ya fueron aprobados ({stats.aprobados} de {stats.subidos}).
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-7 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
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
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Índice de Observaciones</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Reportes enviados que presentaron inconsistencias ({stats.observados} de {stats.subidos}).
              </p>
            </div>
          </div>

          {reporteLoading ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-10 flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <Loader2 size={24} className="animate-spin text-blue-500" />
              <span className="font-medium">Cargando rankings financieros...</span>
            </div>
          ) : reporteError ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-rose-200 dark:border-rose-800 p-8 flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertCircle size={24} />
              <span className="font-medium">{reporteError}</span>
            </div>
          ) : reporteGlobal.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400">
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">No hay datos financieros para comparar</p>
              <p className="text-sm mt-2">Cuando los colegios registren ingresos y egresos en este periodo, aparecerán aquí.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <RankingCard
                title="Ranking de Recaudación de Ingresos"
                subtitle="Top 10 de instituciones con mayor ingreso registrado en el periodo."
                data={rankingIngresos}
                dataKey="totalIngresos"
                icon={TrendingUp}
                tone="emerald"
              />

              <RankingCard
                title="Ranking de Egresos"
                subtitle="Top 10 de instituciones con mayor egreso registrado en el periodo."
                data={rankingEgresos}
                dataKey="totalEgresos"
                icon={TrendingDown}
                tone="rose"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EspecialistaReportesView;

