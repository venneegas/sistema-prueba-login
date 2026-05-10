import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Building2, Loader2, Search, Grid3x3, List, LayoutDashboard } from 'lucide-react';
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
  const [viewType, setViewType] = useState(() => {
    // Cargar preferencia de vista desde localStorage
    return localStorage.getItem('colegiosViewType') || 'grid';
  });
  const scrollContainerRef = useRef(null);

  // Guardar preferencia de vista en localStorage
  useEffect(() => {
    localStorage.setItem('colegiosViewType', viewType);
  }, [viewType]);

  // Guardar posición del scroll antes de cambiar de colegio
  const handleSelectColegio = (colegio) => {
    if (scrollContainerRef.current) {
      const scrollPos = scrollContainerRef.current.scrollTop;
      sessionStorage.setItem(`colegios_scroll_${viewType}`, scrollPos.toString());
    }
    onSelectColegio(colegio);
  };

  // Restaurar posición del scroll cuando regresa al componente
  useEffect(() => {
    const restoreScroll = () => {
      if (scrollContainerRef.current) {
        const savedScroll = sessionStorage.getItem(`colegios_scroll_${viewType}`);
        if (savedScroll) {
          const scrollPos = parseInt(savedScroll, 10);
          scrollContainerRef.current.scrollTop = scrollPos;
        }
      }
    };

    // Restaurar inmediatamente
    restoreScroll();
    
    // También restaurar después de que el DOM se actualice
    const timer = setTimeout(restoreScroll, 50);
    
    return () => clearTimeout(timer);
  }, [viewType, filteredColegios.length]); // Solo se ejecuta si cambia la vista o el número de items
  return (
    <>
      <header className="bg-white dark:bg-slate-800 shadow-sm px-8 py-5 flex items-center justify-between z-10 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          <LayoutDashboard className="text-blue-600" size={28} />
          Colegios Asignados
        </h1>
      </header>

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-8 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por código, numero IE o nombre..."
              className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600 transition-all text-sm font-medium shadow-inner dark:text-slate-200"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <EspecialistaPeriodoFilters
              anioActual={anioActual}
              aniosDisponibles={aniosDisponibles}
              trimestreSeleccionado={trimestreSeleccionado}
              onAnioChange={onAnioChange}
              onTrimestreChange={onTrimestreChange}
            />
            <select
              value={estadoFiltro}
              onChange={(e) => onEstadoFiltroChange(e.target.value)}
              className="flex-grow min-w-[180px] rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600"
            >
              {estadosDisponibles.map((estado) => (
                <option key={estado} value={estado} className="bg-white dark:bg-slate-900 text-black dark:text-white">
                  {estado === 'Todos' ? 'Todos los estados' : estado}
                </option>
              ))}
            </select>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewType('grid')}
                className={`flex items-center justify-center p-2 rounded-md transition-all ${
                  viewType === 'grid'
                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-slate-500'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Vista en cuadrícula"
              >
                <Grid3x3 size={20} />
              </button>
              <button
                onClick={() => setViewType('list')}
                className={`flex items-center justify-center p-2 rounded-md transition-all ${
                  viewType === 'list'
                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-slate-500'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Vista en filas"
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8" ref={scrollContainerRef}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 gap-3">
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
            {viewType === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredColegios.map((colegio) => (
                  <div
                    key={colegio.id}
                    onClick={() => handleSelectColegio(colegio)}
                    className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center text-center group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/50 group-hover:border-indigo-100 dark:group-hover:border-indigo-700 transition-colors duration-300">
                      <Building2 size={32} className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-300" />
                    </div>
                    
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight text-sm mb-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{colegio.nombre}</h3>
                    <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
                      {colegio.numeroIE && (
                        <span className="rounded-md bg-slate-100 dark:bg-slate-700 px-2 py-1 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 group-hover:border-indigo-200 dark:group-hover:border-indigo-700 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                          IE {colegio.numeroIE}
                        </span>
                      )}
                      <span className="rounded-md bg-slate-100 dark:bg-slate-700 px-2 py-1 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                        {colegio.codigoModular}
                      </span>
                    </div>

                    <div
                      className={`mt-auto w-full py-2 rounded-xl text-[11px] font-bold tracking-wide uppercase transition-colors ${
                        colegio.estado === 'Aprobado'
                          ? 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : colegio.estado === 'Observado'
                            ? 'bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : colegio.estado === 'Enviado'
                              ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : colegio.estado === 'Borrador'
                                ? 'bg-amber-50 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {colegio.estado}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-800 sticky -top-8 font-bold text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg z-10 mb-2">
                  <div className="col-span-2">Número IE</div>
                  <div className="col-span-4">Nombre</div>
                  <div className="col-span-2">Código Modular</div>
                  <div className="col-span-2">Provincia - Distrito</div>
                  <div className="col-span-2">Estado</div>
                </div>

                {filteredColegios.map((colegio) => (
                  <div
                    key={colegio.id}
                    onClick={() => handleSelectColegio(colegio)}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-4 py-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-300 cursor-pointer items-center group relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 w-1 h-full bg-indigo-500 transform origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>

                    <div className="col-span-1 lg:col-span-2 flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                        <Building2 size={20} className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                        {colegio.numeroIE ? `IE ${colegio.numeroIE}` : '-'}
                      </span>
                    </div>

                    <div className="col-span-1 lg:col-span-4">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{colegio.nombre}</p>
                    </div>

                    <div className="col-span-1 lg:col-span-2">
                      <span className="font-mono text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600">{colegio.codigoModular}</span>
                    </div>

                    <div className="col-span-1 lg:col-span-2">
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex flex-col leading-tight">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{colegio.distrito}</span>
                        <span className="text-xs ">{colegio.provincia}</span>
                      </p>
                    </div>

                    <div className="col-span-1 lg:col-span-2">
                      <span
                        className={`inline-flex items-center justify-center w-full px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${
                          colegio.estado === 'Aprobado'
                            ? 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : colegio.estado === 'Observado'
                              ? 'bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : colegio.estado === 'Enviado'
                                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : colegio.estado === 'Borrador'
                                  ? 'bg-amber-50 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {colegio.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredColegios.length === 0 && (
              <div className="text-center py-20 text-slate-500 dark:text-slate-400 flex flex-col items-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                  <Building2 size={48} className="text-slate-300" />
                </div>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-200">No se encontraron colegios</p>
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
