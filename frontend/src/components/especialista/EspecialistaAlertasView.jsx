import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Calendar,
  Clock3,
  DatabaseZap,
  FileSearch,
  Info,
  Landmark,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingDown,
  TrendingUp
} from 'lucide-react';

const trimestreLabels = {
  1: '1º Trimestre (Ene - Mar)',
  2: '2º Trimestre (Abr - Jun)',
  3: '3º Trimestre (Jul - Sep)',
  4: '4º Trimestre (Oct - Dic)'
};

const resumenAlertas = [
  {
    label: 'Alertas Totales',
    value: 0,
    icon: AlertTriangle,
    tone: 'rose',
    description: 'Anomalias detectadas'
  },
  {
    label: 'Ingresos',
    value: 0,
    icon: TrendingUp,
    tone: 'pink',
    description: 'Anomalias detectadas'
  },
  {
    label: 'Egresos',
    value: 0,
    icon: TrendingDown,
    tone: 'orange',
    description: 'Anomalias detectadas'
  },
  {
    label: 'Saldos',
    value: 0,
    icon: Landmark,
    tone: 'amber',
    description: 'Anomalias detectadas'
  }
];

const toneClasses = {
  rose: {
    text: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    iconText: 'text-rose-600 dark:text-rose-300'
  },
  pink: {
    text: 'text-pink-600 dark:text-pink-400',
    iconBg: 'bg-pink-100 dark:bg-pink-900/30',
    iconText: 'text-pink-600 dark:text-pink-300'
  },
  orange: {
    text: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconText: 'text-orange-600 dark:text-orange-300'
  },
  amber: {
    text: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconText: 'text-amber-600 dark:text-amber-300'
  }
};

const EspecialistaAlertasView = ({
  anioActual,
  aniosDisponibles,
  trimestreSeleccionado,
  onAnioChange,
  onTrimestreChange
}) => {
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    riesgo: 'todos',
    busqueda: ''
  });

  const alertas = [];
  const periodoLabel = `${trimestreLabels[trimestreSeleccionado] || trimestreLabels[1]} ${anioActual}`;

  return (
    <>
      <header className="bg-white dark:bg-slate-800 shadow-sm px-8 py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between z-10 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <Bell className="text-blue-600" size={28} />
            Alertas
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Plantilla para la detección automática de anomalías financieras con Isolation Forest.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-blue-100 dark:border-slate-700 bg-blue-50/60 dark:bg-slate-900 px-4 py-2.5 text-sm">
            <Clock3 size={18} className="text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-200">Última actualización</p>
              <p className="text-slate-500 dark:text-slate-400">Pendiente de ejecución</p>
            </div>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed"
            title="Disponible cuando el modelo de anomalias este integrado"
          >
            <RefreshCw size={18} />
            Actualizar
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/70 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <DatabaseZap size={20} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 dark:text-slate-100">Módulo preparado para el modelo</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
                  Aún no se muestran resultados porque el modelo Isolation Forest y el volumen de datos históricos
                  todavía no están disponibles para producir alertas confiables.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center justify-center rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
              Sin ejecuciones
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {resumenAlertas.map(({ label, value, icon: Icon, tone, description }) => {
              const classes = toneClasses[tone];
              return (
                <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex items-center gap-5">
                  <div className={`w-16 h-16 rounded-full ${classes.iconBg} ${classes.iconText} flex items-center justify-center`}>
                    <Icon size={28} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${classes.text}`}>{label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <label className="lg:col-span-3">
                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Periodo</span>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5">
                  <Calendar size={18} className="text-blue-500" />
                  <select
                    value={trimestreSeleccionado}
                    onChange={(e) => onTrimestreChange(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none"
                  >
                    <option value="1">1º Trimestre (Ene - Mar)</option>
                    <option value="2">2º Trimestre (Abr - Jun)</option>
                    <option value="3">3º Trimestre (Jul - Sep)</option>
                    <option value="4">4º Trimestre (Oct - Dic)</option>
                  </select>
                </div>
              </label>

              <label className="lg:col-span-2">
                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Año</span>
                <select
                  value={anioActual}
                  onChange={(e) => onAnioChange(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none"
                >
                  {aniosDisponibles.map((anio) => (
                    <option key={anio} value={anio}>{anio}</option>
                  ))}
                </select>
              </label>

              <label className="lg:col-span-2">
                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tipo de anomalía</span>
                <select
                  value={filtros.tipo}
                  onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="todos">Todos</option>
                  <option value="ingresos">Ingresos</option>
                  <option value="egresos">Egresos</option>
                  <option value="saldos">Saldos</option>
                </select>
              </label>

              <label className="lg:col-span-2">
                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nivel de riesgo</span>
                <select
                  value={filtros.riesgo}
                  onChange={(e) => setFiltros({ ...filtros, riesgo: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="todos">Todos</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </label>

              <label className="lg:col-span-3">
                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Buscar alerta</span>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={filtros.busqueda}
                    onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                    placeholder="Buscar por I.E., modulo o detalle..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-11 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none"
                  />
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold">Fecha y hora</th>
                    <th className="p-4 font-bold">Tipo de anomalía</th>
                    <th className="p-4 font-bold">Descripción</th>
                    <th className="p-4 font-bold">Entidad / módulo</th>
                    <th className="p-4 font-bold text-right">Monto involucrado</th>
                    <th className="p-4 font-bold text-center">Nivel de riesgo</th>
                    <th className="p-4 font-bold text-center">Puntaje</th>
                    <th className="p-4 font-bold text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {alertas.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-6 py-14">
                        <div className="flex flex-col items-center text-center max-w-xl mx-auto">
                          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300 mb-4">
                            <FileSearch size={30} />
                          </div>
                          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No hay alertas de anomalías para mostrar</h3>
                          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            La tabla quedará lista para listar resultados cuando el modelo procese datos suficientes del periodo {periodoLabel}.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                <Info size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Sobre las alertas de anomalías</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Este apartado está preparado para mostrar patrones inusuales en ingresos, egresos y saldos comparados con el comportamiento histórico.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300">
              <ShieldAlert size={17} />
              Isolation Forest
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default EspecialistaAlertasView;
