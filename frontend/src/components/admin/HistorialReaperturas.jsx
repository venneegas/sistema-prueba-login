import React, { useState, useEffect, useCallback } from 'react';
import { buildApiUrl } from '../../config/api';
import { History, RefreshCw, Search } from 'lucide-react';

const HistorialReaperturas = ({ showToast }) => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estados para búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchHistorial = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch(buildApiUrl('/api/admin/cierres/historial'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setHistorial(data.data || []);
        if (isManualRefresh) showToast?.('Historial actualizado correctamente.');
      } else {
        showToast?.(data.message || 'Error al cargar el historial.', 'error');
      }
    } catch (error) {
      showToast?.('Error de red al cargar el historial.', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchHistorial(false);
  }, [fetchHistorial]);

  // Lógica de filtrado
  const filteredHistorial = historial.filter(item =>
    (item.institucion && item.institucion.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.numero && String(item.numero).toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.accion && item.accion.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.motivo && item.motivo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (new Date(item.fecha).toLocaleString('es-PE').includes(searchTerm))
  );

  // Lógica de paginación
  const totalPages = Math.ceil(filteredHistorial.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedHistorial = filteredHistorial.slice(startIndex, endIndex);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Cargando historial de reaperturas...</div>;
  }

  return (
    <>
      {/* Barra de Búsqueda y controles */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por institución, acción, motivo..."
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
              onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-500 text-sm font-medium">de {filteredHistorial.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-700 flex items-center gap-3">
            <History size={20} className="text-blue-600" />
            Registro de Acciones sobre Trimestres
          </h3>
          <button
            onClick={() => fetchHistorial(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg font-bold text-xs transition-all"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Actualizando...' : 'Refrescar'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Fecha y Hora</th>
                <th className="p-4 font-bold">Acción</th>
                <th className="p-4 font-bold">Institución Afectada</th>
                <th className="p-4 font-bold">Motivo / Justificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedHistorial.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500 font-medium">
                    {historial.length === 0
                      ? 'No se encontraron acciones de reapertura o prórroga.'
                      : 'No hay registros que coincidan con la búsqueda.'}
                  </td>
                </tr>
              ) : (
                displayedHistorial.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-sm text-slate-600 whitespace-nowrap">{new Date(item.fecha).toLocaleString('es-PE')}</td>
                    <td className="p-4 text-sm font-bold text-slate-800">{item.accion} T{item.trimestre}-{item.anio}</td>
                    <td className="p-4 text-sm text-slate-600">{item.numero || '-'} - {item.institucion || `Director ID: ${item.director_id}`}</td>
                    <td className="p-4 text-sm text-slate-500 italic">{item.motivo || 'Sin motivo registrado.'}</td>
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
              Mostrando <span className="font-bold">{startIndex + 1}</span> a <span className="font-bold">{Math.min(endIndex, filteredHistorial.length)}</span> de <span className="font-bold">{filteredHistorial.length}</span> registros
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
    </>
  );
};

export default HistorialReaperturas;