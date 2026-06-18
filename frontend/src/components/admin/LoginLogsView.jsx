import React, { useCallback, useEffect, useState } from 'react';
import { Key, RefreshCw, Search } from 'lucide-react';
import { buildApiUrl } from '../../config/api'; // Ajusta la ruta si es necesario
import AdminPageHeader from './AdminPageHeader';

const LoginLogsView = ({ showToast }) => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/api/admin/login-logs'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setLogs(data.data);
        if (isManualRefresh) showToast('Registros de sesión actualizados correctamente.');
      } else {
        setError(data.message || 'Error al obtener los registros.');
        if (isManualRefresh) showToast(data.message || 'Error al obtener los registros.', 'error');
      }
    } catch (err) {
      console.error(err);
      setError('Error de red al intentar conectar con el servidor.');
      if (isManualRefresh) showToast('Error de red al intentar conectar con el servidor.', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLogs(false);
  }, [fetchLogs]);

  const filteredLogs = logs.filter(log => 
    (log.email && log.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.ip_address && log.ip_address.includes(searchTerm)) ||
    (log.user_agent && log.user_agent.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (new Date(log.fecha_hora).toLocaleString('es-PE').includes(searchTerm))
  );

  // Calcular paginación
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedLogs = filteredLogs.slice(startIndex, endIndex);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  if (loading && !isRefreshing) return <div className="flex-1 flex justify-center items-center p-8 text-slate-500 font-medium">Cargando registros de sesión...</div>;
  if (error) return <div className="flex-1 flex justify-center items-center p-8 text-rose-500 font-bold">{error}</div>;

  return (
    <>
      <AdminPageHeader
        icon={Key}
        title="Logs de Inicio de Sesion"
        subtitle="Supervisa accesos exitosos y fallidos, direcciones IP y detalles del navegador."
        actions={(
          <button 
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
            {isRefreshing ? 'Actualizando...' : 'Refrescar'}
          </button>
        )}
      />
      
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Barra de Búsqueda */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por usuario, IP o fecha..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 w-full justify-between md:justify-start">
                <select 
                  className="bg-transparent text-slate-700 text-sm font-medium outline-none cursor-pointer"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-slate-500 text-sm font-medium">de {filteredLogs.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold">Fecha y Hora</th>
                    <th className="p-4 font-bold">Usuario / Email</th>
                    <th className="p-4 font-bold text-center">Estado</th>
                    <th className="p-4 font-bold">Detalle</th>
                    <th className="p-4 font-bold">Dirección IP</th>
                    <th className="p-4 font-bold">Navegador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500 font-medium">No se encontraron registros que coincidan con la búsqueda.</td>
                    </tr>
                  ) : (
                    displayedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 text-sm text-slate-600 whitespace-nowrap">{new Date(log.fecha_hora).toLocaleString('es-PE')}</td>
                        <td className="p-4 text-sm font-bold text-slate-800">{log.email}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${log.exitoso ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {log.exitoso ? 'Exitoso' : 'Fallido'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600">{log.razon_fallo || '-'}</td>
                        <td className="p-4 text-sm font-mono text-slate-600">{log.ip_address || 'Desconocida'}</td>
                        <td className="p-4 text-sm text-slate-500 truncate max-w-xs" title={log.user_agent}>{log.user_agent}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Controles de paginación */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="text-sm text-slate-600 font-medium text-center sm:text-left">
                  Mostrando <span className="font-bold">{startIndex + 1}</span> a <span className="font-bold">{Math.min(endIndex, filteredLogs.length)}</span> de <span className="font-bold">{filteredLogs.length}</span> registros
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-colors ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:text-blue-600 border border-slate-200'}`}
                    title="Próxima página"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginLogsView;

