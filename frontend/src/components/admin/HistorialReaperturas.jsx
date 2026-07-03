import React, { useState, useEffect, useCallback } from 'react';
import { buildApiUrl } from '../../config/api';
import { History, RefreshCw } from 'lucide-react';

const HistorialReaperturas = ({ showToast }) => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Cargando historial de reaperturas...</div>;
  }

  return (
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
            {historial.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-500 font-medium">No se encontraron acciones de reapertura o prórroga.</td>
              </tr>
            ) : (
              historial.map((item) => (
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
    </div>
  );
};

export default HistorialReaperturas;