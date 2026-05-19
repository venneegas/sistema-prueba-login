import React, { useState, useEffect } from 'react';
import ColegioDetalle from './ColegioDetalle';
import ChangePasswordModal from '../ChangePasswordModal';
import LogoutModal from '../LogoutModal';
import EspecialistaSidebar from './EspecialistaSidebar';
import EspecialistaReportesView from './EspecialistaReportesView';
import EspecialistaConfiguracionView from './EspecialistaConfiguracionView';
import EspecialistaExploradorView from './EspecialistaExploradorView';
import EspecialistaSolicitudesPage from './EspecialistaSolicitudesPage';
import EspecialistaAlertasView from './EspecialistaAlertasView';
import ReportesView from './ReportesView';
import useEspecialistaColegios from '../../hooks/useEspecialistaColegios';
import useEspecialistaReporteGlobal from '../../hooks/useEspecialistaReporteGlobal';
import useEspecialistaStats from '../../hooks/useEspecialistaStats';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const ESTADOS_EXPLORADOR = ['Borrador', 'Enviado', 'Observado', 'Aprobado'];

const EspecialistaDashboard = ({ user, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [activeView, setActiveView] = useState('explorador');
  const [selectedColegio, setSelectedColegio] = useState(null);
  const [trimestreSeleccionado, setTrimestreSeleccionado] = useState('1');

  const currentSysYear = new Date().getFullYear();
  const [anioActual, setAnioActual] = useState(currentSysYear >= 2026 ? currentSysYear : 2026);
  const anioTope = Math.max(2026, currentSysYear) + 1;
  const aniosDisponibles = Array.from({ length: anioTope - 2026 + 1 }, (_, i) => 2026 + i);

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' ||
                   (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDarkMode(!isDarkMode);
  };

  const { colegios, loading, error } = useEspecialistaColegios({
    trimestreSeleccionado,
    anioActual
  });
  const {
    reporte: reporteGlobal,
    loading: reporteLoading,
    error: reporteError
  } = useEspecialistaReporteGlobal({
    trimestreSeleccionado,
    anioActual
  });

  const estadosDisponibles = [
    'Todos',
    ...ESTADOS_EXPLORADOR,
    ...colegios
      .map((colegio) => colegio.estado)
      .filter((estado) => estado && !ESTADOS_EXPLORADOR.includes(estado))
  ];

  const filteredColegios = colegios.filter(
    (c) =>
      (
        (c.nombre && c.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.codigoModular && c.codigoModular.includes(searchTerm)) ||
        (c.numeroIE && c.numeroIE.toLowerCase().includes(searchTerm.toLowerCase()))
      ) &&
      (estadoFiltro === 'Todos' || c.estado === estadoFiltro)
  );

  const { stats, pctSubidos, pctAprobados, pctObservados } = useEspecialistaStats(colegios);

  const handleChangeView = (view) => {
    setActiveView(view);
    setSelectedColegio(null);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <EspecialistaSidebar
        activeView={activeView}
        user={user}
        onChangeView={handleChangeView}
        onLogout={() => setIsLogoutModalOpen(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeView === 'solicitudes' ? (
          <EspecialistaSolicitudesPage />
        ) : activeView === 'estadisticas' ? (
          <EspecialistaReportesView
            anioActual={anioActual}
            aniosDisponibles={aniosDisponibles}
            trimestreSeleccionado={trimestreSeleccionado}
            onAnioChange={setAnioActual}
            onTrimestreChange={setTrimestreSeleccionado}
            stats={stats}
            pctSubidos={pctSubidos}
            pctAprobados={pctAprobados}
            pctObservados={pctObservados}
            reporteGlobal={reporteGlobal}
            reporteLoading={reporteLoading}
            reporteError={reporteError}
          />
        ) : activeView === 'alertas' ? (
          <EspecialistaAlertasView
            anioActual={anioActual}
            aniosDisponibles={aniosDisponibles}
            trimestreSeleccionado={trimestreSeleccionado}
            onAnioChange={setAnioActual}
            onTrimestreChange={setTrimestreSeleccionado}
          />
        ) : activeView === 'reportes' ? (
          <ReportesView
            anioActual={anioActual}
            aniosDisponibles={aniosDisponibles}
            trimestreSeleccionado={trimestreSeleccionado}
            onAnioChange={setAnioActual}
            onTrimestreChange={setTrimestreSeleccionado}
            reporteGlobal={reporteGlobal}
            reporteLoading={reporteLoading}
            showToast={showToast}
          />
        ) : activeView === 'configuracion' ? (
          <EspecialistaConfiguracionView
            user={user}
            onOpenChangePassword={() => setIsChangePasswordOpen(true)}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />
        ) : selectedColegio ? (
          <ColegioDetalle
            colegio={selectedColegio}
            onBack={() => setSelectedColegio(null)}
            trimestre={trimestreSeleccionado}
            anio={anioActual}
          />
        ) : (
          <EspecialistaExploradorView
            anioActual={anioActual}
            aniosDisponibles={aniosDisponibles}
            trimestreSeleccionado={trimestreSeleccionado}
            onAnioChange={setAnioActual}
            onTrimestreChange={setTrimestreSeleccionado}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            estadoFiltro={estadoFiltro}
            onEstadoFiltroChange={setEstadoFiltro}
            estadosDisponibles={estadosDisponibles}
            loading={loading}
            error={error}
            filteredColegios={filteredColegios}
            onSelectColegio={setSelectedColegio}
          />
        )}

        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          mode="optional"
        />

        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={onLogout}
        />

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
      </main>
    </div>
  );
};

export default EspecialistaDashboard;
