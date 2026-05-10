import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, CheckCircle, XCircle, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { buildApiUrl } from '../../config/api';

const EspecialistaSolicitudesView = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('pendiente'); // pendiente, resueltas
  const [procesandoId, setProcesandoId] = useState(null);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl('/api/solicitudes-reemplazo'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setSolicitudes(data.data || []);
      } else {
        throw new Error(data.message || 'Error al obtener solicitudes');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al conectar con la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  const procesarSolicitud = async (id, accion) => {
    const confirmar = window.confirm(
      accion === 'aprobar' 
        ? '¿Estás seguro de APROBAR esta solicitud? Se generarán nuevas credenciales para este usuario.' 
        : '¿Estás seguro de RECHAZAR esta solicitud?'
    );
    
    if (!confirmar) return;

    setProcesandoId(id);
    try {
      const response = await fetch(buildApiUrl(`/api/solicitudes-reemplazo/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ estado: accion === 'aprobar' ? 'aprobado' : 'rechazado' })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, estado: accion === 'aprobar' ? 'aprobado' : 'rechazado' } : s));
        alert(`Solicitud ${accion === 'aprobar' ? 'aprobada' : 'rechazada'} exitosamente.`);
      } else {
        throw new Error(data.message || 'Error al procesar la solicitud');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcesandoId(null);
    }
  };

  const solicitudesFiltradas = solicitudes.filter(s => 
    filtro === 'pendiente' ? s.estado === 'pendiente' : s.estado !== 'pendiente'
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[28px] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] border border-slate-200 dark:border-slate-700">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 dark:border-slate-700 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
              <ShieldCheck className="text-blue-600 dark:text-blue-400" size={28} />
              Gestión de Credenciales
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Administra las solicitudes de reemplazo de directores o tesoreros.</p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl">
            <button
              onClick={() => setFiltro('pendiente')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                filtro === 'pendiente' 
                  ? 'bg-white dark:bg-slate-600 text-blue-700 dark:text-blue-300 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Pendientes
              {solicitudes.filter(s => s.estado === 'pendiente').length > 0 && (
                <span className="ml-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full dark:bg-rose-600">
                  {solicitudes.filter(s => s.estado === 'pendiente').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setFiltro('resueltas')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                filtro === 'resueltas' 
                  ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Historial / Resueltas
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 p-4 rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle size={20} /> {error}
          </div>
        ) : solicitudesFiltradas.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <Users size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">No hay solicitudes {filtro === 'pendiente' ? 'pendientes' : 'en el historial'}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Todas las peticiones de cambio de credenciales están al día.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {solicitudesFiltradas.map((solicitud) => (
              <div key={solicitud.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  
                  {/* Información Principal */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${solicitud.estado === 'pendiente' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : solicitud.estado === 'aprobado' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                        {solicitud.estado === 'pendiente' ? <Clock size={24} /> : solicitud.estado === 'aprobado' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{solicitud.school}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">
                          Enviado el {new Date(solicitud.fecha_creacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl text-sm text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-600 leading-relaxed">
                      <span className="font-bold block mb-1">Motivo del reemplazo:</span>
                      {solicitud.motivo}
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
                        <Mail size={16} className="text-blue-500 dark:text-blue-400" />
                        <span className="font-medium">{solicitud.nuevoCorreo}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600">
                        <Phone size={16} className="text-slate-500" />
                        <span className="font-medium">{solicitud.telefono}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="lg:w-64 flex flex-col justify-center gap-3 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-700 pt-4 lg:pt-0 lg:pl-6">
                    {solicitud.estado === 'pendiente' ? (
                      <>
                        <button
                          onClick={() => procesarSolicitud(solicitud.id, 'aprobar')}
                          disabled={procesandoId === solicitud.id}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={18} /> Aprobar y Asignar
                        </button>
                        <button
                          onClick={() => procesarSolicitud(solicitud.id, 'rechazar')}
                          disabled={procesandoId === solicitud.id}
                          className="w-full flex items-center justify-center gap-2 bg-white dark:bg-transparent border-2 border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:border-rose-200 dark:hover:border-rose-800 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                        >
                          <XCircle size={18} /> Rechazar
                        </button>
                      </>
                    ) : (
                      <div className={`text-center py-4 rounded-xl border ${solicitud.estado === 'aprobado' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'}`}>
                        <span className="font-bold text-sm uppercase tracking-wider flex flex-col items-center gap-2">
                          {solicitud.estado === 'aprobado' ? <CheckCircle size={28} /> : <XCircle size={28} />}
                          {solicitud.estado === 'aprobado' ? 'Solicitud Aprobada' : 'Solicitud Rechazada'}
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EspecialistaSolicitudesView;