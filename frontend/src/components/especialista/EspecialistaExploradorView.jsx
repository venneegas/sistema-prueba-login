import React from 'react';
import { AlertCircle, Folder, Loader2, Search } from 'lucide-react';
import EspecialistaPeriodoFilters from './EspecialistaPeriodoFilters';

const EspecialistaExploradorView = ({
  anioActual,
  aniosDisponibles,
  trimestreSeleccionado,
  onAnioChange,
  onTrimestreChange,
  searchTerm,
  onSearchChange,
  estadoFiltro,
  onEstadoFiltroChange,
  estadosDisponibles,
  loading,
  error,
  filteredColegios,
  onSelectColegio
}) => {
  return (
    <>
      <header className="bg-white shadow-sm px-8 py-5 flex items-center justify-between z-10 border-b border-slate-200">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-slate-800">Colegios Asignados</h1>
          <EspecialistaPeriodoFilters
            anioActual={anioActual}
            aniosDisponibles={aniosDisponibles}
            trimestreSeleccionado={trimestreSeleccionado}
            onAnioChange={onAnioChange}
            onTrimestreChange={onTrimestreChange}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por codigo, numero IE o nombre..."
              className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all text-sm font-medium shadow-inner"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <select
            value={estadoFiltro}
            onChange={(e) => onEstadoFiltroChange(e.target.value)}
            className="min-w-[180px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          >
            {estadosDisponibles.map((estado) => (
              <option key={estado} value={estado}>
                {estado === 'Todos' ? 'Todos los estados' : estado}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
            <Loader2 size={40} className="animate-spin text-blue-500" />
            <p className="font-medium">Cargando colegios desde la UGEL...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-rose-500 gap-3">
            <AlertCircle size={48} className="text-rose-400" />
            <p className="font-bold">{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredColegios.map((colegio) => (
                <div
                  key={colegio.id}
                  onClick={() => onSelectColegio(colegio)}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center group"
                >
                  <Folder
                    size={72}
                    className="mb-3 text-blue-400 group-hover:text-blue-500 transition-colors"
                    fill="currentColor"
                    fillOpacity={0.2}
                    strokeWidth={1.5}
                  />
                  <h3 className="font-bold text-slate-800 line-clamp-2 leading-tight text-sm mb-1">{colegio.nombre}</h3>
                  <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
                    {colegio.numeroIE && (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-700 border border-blue-100">
                        IE {colegio.numeroIE}
                      </span>
                    )}
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-500">
                      {colegio.codigoModular}
                    </span>
                  </div>

                  <div
                    className={`mt-auto w-full py-1.5 rounded-lg text-[11px] font-bold tracking-wide uppercase ${
                      colegio.estado === 'Aprobado'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : colegio.estado === 'Observado'
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : colegio.estado === 'Enviado'
                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                            : colegio.estado === 'Borrador'
                              ? 'bg-amber-50 text-amber-600 border border-amber-100'
                              : 'bg-slate-50 text-slate-500 border border-slate-100'
                    }`}
                  >
                    {colegio.estado}
                  </div>
                </div>
              ))}
            </div>

            {filteredColegios.length === 0 && (
              <div className="text-center py-20 text-slate-500 flex flex-col items-center">
                <div className="bg-slate-100 p-6 rounded-full mb-4">
                  <Folder size={48} className="text-slate-300" />
                </div>
                <p className="text-lg font-medium text-slate-700">No se encontraron colegios</p>
                <p className="text-sm mt-1">Intenta con otro termino de busqueda o cambia el estado seleccionado</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default EspecialistaExploradorView;
