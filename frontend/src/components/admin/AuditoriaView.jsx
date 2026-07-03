import React, { useCallback, useEffect, useState } from 'react';
import { Activity, RefreshCw, Search } from 'lucide-react';
import { buildApiUrl } from '../../config/api';
import AdminPageHeader from './AdminPageHeader';
import HistorialReaperturas from './HistorialReaperturas';

const AuditoriaView = ({ showToast }) => {
  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState('acciones');

  // Estados para la pestaña "Auditoría de Acciones"
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState({ totalItems: 0, totalPages: 1 });
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce para el término de búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Volver a la primera página con cada nueva búsqueda
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const cargarLogs = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setCargando(true);
      }
      setError(null);

      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
      });
      const response = await fetch(buildApiUrl(`/api/admin/auditoria?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data.items || []);
        setPaginationInfo(data.data.pagination || { totalItems: 0, totalPages: 1 });
        if (isManualRefresh) showToast('Registros actualizados correctamente.');
      } else {
        setError(data.message);
        if (isManualRefresh) showToast(data.message, 'error');
      }
    } catch (err) {
      setError('Error de conexión al servidor.');
      if (isManualRefresh) showToast('Error de conexión al servidor.', 'error');
    } finally {
      setCargando(false);
      setIsRefreshing(false);
    }
  }, [showToast, currentPage, itemsPerPage, debouncedSearchTerm]);

  useEffect(() => {
    if (activeTab === 'acciones') {
      cargarLogs(false);
    }
  }, [cargarLogs, activeTab]);

  // Función para darle color a la acción
  const getBadgeColor = (accion) => {
    switch (accion) {
      case 'CREAR': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ACTUALIZAR': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ELIMINAR': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CAMBIAR_PASSWORD': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'DESCARGAR': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  if (cargando && !isRefreshing && activeTab === 'acciones') return <div className="flex-1 flex justify-center items-center p-8 text-slate-500 font-medium">Cargando registros de auditoría...</div>;
  if (error) return <div className="flex-1 flex justify-center items-center p-8 text-rose-500 font-bold">{error}</div>;

  return (
    <>
      <AdminPageHeader
        icon={Activity}
        title="Módulo de Auditoría y Trazabilidad"
        subtitle="Supervisa todas las acciones críticas, registros de sesión y cambios de estado en el sistema."
        actions={(
          activeTab === 'acciones' && (
            <button 
              onClick={() => cargarLogs(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
              {isRefreshing ? 'Actualizando...' : 'Refrescar'}
            </button>
          )
        )}
      />

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Pestañas de Navegación */}
          <div className="flex border-b border-slate-200 bg-white/50 rounded-t-xl px-2 pt-2">
            <button
              onClick={() => setActiveTab('acciones')}
              className={`py-3 px-5 text-sm font-bold transition-colors ${
                activeTab === 'acciones'
                  ? 'border-b-2 border-blue-600 text-blue-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Auditoría de Acciones
            </button>
            <button
              onClick={() => setActiveTab('reaperturas')}
              className={`py-3 px-5 text-sm font-bold transition-colors ${
                activeTab === 'reaperturas'
                  ? 'border-b-2 border-blue-600 text-blue-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Historial de Reaperturas
            </button>
          </div>

          {activeTab === 'acciones' && (
            <>
              {/* Barra de Búsqueda */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar por usuario, módulo o fecha..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 w-full md:w-auto justify-between md:justify-start">
                    <select 
                      className="bg-transparent text-slate-700 text-sm font-medium outline-none cursor-pointer"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(parseInt(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-slate-500 text-sm font-medium">de {paginationInfo.totalItems}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="p-4 font-bold">Fecha y Hora</th>
                        <th className="p-4 font-bold">Usuario</th>
                        <th className="p-4 font-bold">Módulo</th>
                        <th className="p-4 font-bold text-center">Acción</th>
                        <th className="p-4 font-bold">Descripción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cargando && !isRefreshing ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">Cargando...</td>
                        </tr>
                      ) : logs.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-slate-500 font-medium">
                            {paginationInfo.totalItems > 0
                              ? 'No hay registros que coincidan con la búsqueda.'
                              : 'No se encontraron registros de auditoría.'}
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                              {new Date(log.fecha_hora).toLocaleString('es-PE')}
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-slate-800">{log.email || 'Sistema'}</div>
                              <div className="text-xs text-slate-500 capitalize">{log.rol}</div>
                            </td>
                            <td className="p-4 text-sm font-medium text-slate-700">{log.modulo}</td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getBadgeColor(log.accion)}`}>
                                {log.accion}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-slate-600">{log.descripcion}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Controles de paginación */}
                {paginationInfo.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <div className="text-sm text-slate-600 font-medium text-center sm:text-left">
                      Mostrando <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold">{Math.min(currentPage * itemsPerPage, paginationInfo.totalItems)}</span> de <span className="font-bold">{paginationInfo.totalItems}</span> registros
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg transition-colors ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:text-blue-600 border border-slate-200'}`}
                        title="Página anterior"
                      >
                        ←
                      </button>

                      <div className="flex items-center gap-1 overflow-x-auto max-w-[150px] sm:max-w-[300px] hide-scrollbar">
                        {Array.from({ length: paginationInfo.totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[40px] h-10 rounded-lg font-bold transition-colors shrink-0 ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(paginationInfo.totalPages, prev + 1))}
                        disabled={currentPage === paginationInfo.totalPages}
                        className={`p-2 rounded-lg transition-colors ${currentPage === paginationInfo.totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:text-blue-600 border border-slate-200'}`}
                        title="Próxima página"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'reaperturas' && (
            <HistorialReaperturas showToast={showToast} />
          )}
        </div>
      </div>
    </>
  );
};

export default AuditoriaView;
