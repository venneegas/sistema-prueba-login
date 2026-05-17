import React, { useState, useEffect } from 'react';
import { Database, LogOut, ShieldAlert, Server, ShieldCheck, Users, Activity, Settings, Key, Network, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import DatabaseView from './DatabaseView';
import UsersView from './UsersView';
import AuditoriaView from './AuditoriaView';
import LoginLogsView from './LoginLogsView'; // Importa el nuevo componente para logs de inicio de sesión
import FlujosView from './FlujosView'; // Importamos el nuevo componente
import ReportesView from './ReportesView';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('database');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); // ESTADO GLOBAL DEL TOAST

  // Auto-ocultar el toast global después de 3 segundos
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Menú Lateral - Azul Oscuro con acentos Dorados */}
      <aside className="w-64 bg-blue-950 text-white flex flex-col shadow-2xl z-20 relative overflow-hidden">
        {/* Decoración de fondo en el sidebar */}
        <div className="absolute -right-10 -top-10 text-blue-900/50">
          <ShieldAlert size={150} />
        </div>

        <div className="p-6 border-b border-blue-900/50 relative z-10">
          <h2 className="text-2xl font-black text-amber-400 tracking-tight flex items-center gap-2">
            <Server size={24} />
            TI ADMIN
          </h2>
          <p className="text-xs text-blue-200 mt-1 font-medium">Gestión de Infraestructura</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto relative z-10">
          <button 
            onClick={() => setActiveTab('database')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'database' ? 'bg-blue-800 text-white shadow-md border-l-4 border-amber-400' : 'text-blue-300 hover:bg-blue-900 hover:text-white border-l-4 border-transparent hover:border-blue-400'}`}
          >
            <Database size={20} className={activeTab === 'database' ? 'text-amber-400' : ''} />
            <span className={activeTab === 'database' ? 'font-bold' : 'font-medium'}>Base de Datos</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('usuarios')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'usuarios' ? 'bg-blue-800 text-white shadow-md border-l-4 border-amber-400' : 'text-blue-300 hover:bg-blue-900 hover:text-white border-l-4 border-transparent hover:border-blue-400'}`}
          >
            <Users size={20} className={activeTab === 'usuarios' ? 'text-amber-400' : ''} />
            <span className={activeTab === 'usuarios' ? 'font-bold' : 'font-medium'}>Gestión Usuarios</span>
          </button>

          <button 
            onClick={() => setActiveTab('flujos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'flujos' ? 'bg-blue-800 text-white shadow-md border-l-4 border-amber-400' : 'text-blue-300 hover:bg-blue-900 hover:text-white border-l-4 border-transparent hover:border-blue-400'}`}
          >
            <Network size={20} className={activeTab === 'flujos' ? 'text-amber-400' : ''} />
            <span className={activeTab === 'flujos' ? 'font-bold' : 'font-medium'}>Flujos del Sistema</span>
          </button>

          <button 
            onClick={() => setActiveTab('reportes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reportes' ? 'bg-blue-800 text-white shadow-md border-l-4 border-amber-400' : 'text-blue-300 hover:bg-blue-900 hover:text-white border-l-4 border-transparent hover:border-blue-400'}`}
          >
            <FileSpreadsheet size={20} className={activeTab === 'reportes' ? 'text-amber-400' : ''} />
            <span className={activeTab === 'reportes' ? 'font-bold' : 'font-medium'}>Reportes y Descargas</span>
          </button>

          <button 
            onClick={() => setActiveTab('sesiones')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'sesiones' ? 'bg-blue-800 text-white shadow-md border-l-4 border-amber-400' : 'text-blue-300 hover:bg-blue-900 hover:text-white border-l-4 border-transparent hover:border-blue-400'}`}
          >
            <Key size={20} className={activeTab === 'sesiones' ? 'text-amber-400' : ''} />
            <span className={activeTab === 'sesiones' ? 'font-bold' : 'font-medium'}>Logs de Sesión</span>
          </button>

          <button 
            onClick={() => setActiveTab('auditoria')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'auditoria' ? 'bg-blue-800 text-white shadow-md border-l-4 border-amber-400' : 'text-blue-300 hover:bg-blue-900 hover:text-white border-l-4 border-transparent hover:border-blue-400'}`}
          >
            <Activity size={20} className={activeTab === 'auditoria' ? 'text-amber-400' : ''} />
            <span className={activeTab === 'auditoria' ? 'font-bold' : 'font-medium'}>Logs de Auditoría</span>
          </button>

          <button 
            onClick={() => setActiveTab('seguridad')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'seguridad' ? 'bg-blue-800 text-white shadow-md border-l-4 border-amber-400' : 'text-blue-300 hover:bg-blue-900 hover:text-white border-l-4 border-transparent hover:border-blue-400'}`}
          >
            <ShieldCheck size={20} className={activeTab === 'seguridad' ? 'text-amber-400' : ''} />
            <span className={activeTab === 'seguridad' ? 'font-bold' : 'font-medium'}>Seguridad</span>
          </button>

          <div className="pt-4 mt-2 border-t border-blue-900/50">
            <button 
              onClick={() => setActiveTab('configuracion')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'configuracion' ? 'bg-blue-800 text-white shadow-md border-l-4 border-amber-400' : 'text-blue-300 hover:bg-blue-900 hover:text-white border-l-4 border-transparent hover:border-blue-400'}`}
            >
              <Settings size={20} className={activeTab === 'configuracion' ? 'text-amber-400' : ''} />
              <span className={activeTab === 'configuracion' ? 'font-bold' : 'font-medium'}>Config. Sistema</span>
            </button>
          </div>
        </nav>

        {/* Zona inferior - Botón Rojo para salir */}
        <div className="p-4 border-t border-blue-900/50 bg-blue-950 relative z-10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center border border-amber-400/30">
              <Server size={18} className="text-amber-400" />
            </div>
            <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user?.nombre || 'Administrador'}</p>
              <p className="text-xs text-amber-400/80 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all font-bold shadow-lg shadow-red-900/20"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal - Blanco y limpio */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'database' ? (
          <DatabaseView showToast={showToast} />
        ) : activeTab === 'usuarios' ? (
          <UsersView showToast={showToast} />
        ) : activeTab === 'auditoria' ? (
          <AuditoriaView showToast={showToast} />
        ) : activeTab === 'sesiones' ? (
          <LoginLogsView showToast={showToast} />
        ) : activeTab === 'flujos' ? (
          <FlujosView showToast={showToast} />
        ) : activeTab === 'reportes' ? (
          <ReportesView showToast={showToast} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Server size={48} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Módulo en Construcción</h2>
            <p className="text-slate-500 max-w-md">Esta sección está planificada para la siguiente fase de desarrollo del sistema.</p>
          </div>
        )}
      </main>

      {/* Toast Notification Global */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[70] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-bold text-white ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
