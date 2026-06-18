import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Server } from 'lucide-react';
import DatabaseView from './DatabaseView';
import UsersView from './UsersView';
import AuditoriaView from './AuditoriaView';
import LoginLogsView from './LoginLogsView';
import FlujosView from './FlujosView';
import AdminControlView from './AdminControlView';
import AdminSidebar from './AdminSidebar';
import useTheme from '../../hooks/useTheme';
import FloatingThemeToggle from '../FloatingThemeToggle';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('control');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (!toast.show) return undefined;

    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.show]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'control':
        return <AdminControlView showToast={showToast} />;
      case 'database':
        return <DatabaseView showToast={showToast} />;
      case 'usuarios':
        return <UsersView showToast={showToast} />;
      case 'auditoria':
        return <AuditoriaView showToast={showToast} />;
      case 'sesiones':
        return <LoginLogsView showToast={showToast} />;
      case 'flujos':
        return <FlujosView showToast={showToast} />;
      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-center animate-in fade-in zoom-in duration-300 dark:bg-slate-900">
            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner dark:bg-blue-950/50 dark:text-blue-300">
              <Server size={48} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2 dark:text-white">Modulo en Construccion</h2>
            <p className="text-slate-500 max-w-md dark:text-slate-400">
              Esta seccion esta planificada para la siguiente fase de desarrollo del sistema.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="admin-theme flex h-screen bg-slate-50 dark:bg-slate-900">
      <AdminSidebar
        activeTab={activeTab}
        user={user}
        onChangeTab={setActiveTab}
        onLogout={onLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </main>

      <FloatingThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />

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
