import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Search } from 'lucide-react';
import { buildApiUrl } from '../../config/api';

const AuditoriaView = () => {
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarLogs();
  }, []);

  const cargarLogs = async () => {
    try {
      const token = localStorage.getItem('token'); // Asegúrate de usar la key de tu token
      const response = await fetch(buildApiUrl('/api/admin/auditoria'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error de conexión al servidor.');
    } finally {
      setCargando(false);
    }
  };

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

  const filteredLogs = logs.filter(log => 
    (log.email && log.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.modulo && log.modulo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.accion && log.accion.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.descripcion && log.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (new Date(log.fecha_hora).toLocaleString('es-PE').includes(searchTerm))
  );

  if (cargando) return <div className="flex-1 flex justify-center items-center p-8 text-slate-500 font-medium">Cargando registros de auditoría...</div>;
  if (error) return <div className="flex-1 flex justify-center items-center p-8 text-rose-500 font-bold">{error}</div>;

  return (
    <>
      <header className="bg-white shadow-sm px-8 py-5 flex items-center justify-between z-10 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Activity className="text-blue-600" size={28} />
          Logs de Auditoría
        </h1>
        
        <button 
          onClick={cargarLogs} 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm"
        >
          <RefreshCw size={18} />
          Refrescar
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
        <div className="max-w-6xl mx-auto space-y-6">

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
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500 font-medium">No se encontraron registros que coincidan con la búsqueda.</td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
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
          </div>
        </div>
      </div>
    </>
  );
};

export default AuditoriaView;
