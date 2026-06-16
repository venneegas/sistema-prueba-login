import React, { useState, useEffect, useRef } from 'react';
import ColegioDetalle from './ColegioDetalle';
import ChangePasswordModal from '../ChangePasswordModal';
import LogoutModal from '../LogoutModal';
import EspecialistaSidebar from './EspecialistaSidebar';
import EspecialistaReportesView from './EspecialistaReportesView';
import EspecialistaConfiguracionView from './EspecialistaConfiguracionView';
import EspecialistaExploradorView from './EspecialistaExploradorView';
import EspecialistaSolicitudesPage from './EspecialistaSolicitudesPage';
import EspecialistaAlertasView from './EspecialistaAlertasView';
import EspecialistaDatasetMLView from './EspecialistaDatasetMLView';
import ReportesView from './ReportesView';
import useEspecialistaColegios from '../../hooks/useEspecialistaColegios';
import useEspecialistaReporteGlobal from '../../hooks/useEspecialistaReporteGlobal';
import useEspecialistaStats from '../../hooks/useEspecialistaStats';
import useTheme from '../../hooks/useTheme';
import FloatingThemeToggle from '../FloatingThemeToggle';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { ESTADOS_REPORTE } from '../../utils/estadoReporte';

const ESTADOS_EXPLORADOR = ESTADOS_REPORTE;
const COLEGIO_DETALLE_HISTORY_STATE = 'especialista-colegio-detalle';

const obtenerTrimestreActual = () => {
  const mesActual = new Date().getMonth();
  return String(Math.floor(mesActual / 3) + 1);
};

const EspecialistaDashboard = ({ user, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [activeView, setActiveView] = useState('explorador');
  const [selectedColegio, setSelectedColegio] = useState(null);
  const selectedColegioRef = useRef(null);
  const [trimestreSeleccionado, setTrimestreSeleccionado] = useState(obtenerTrimestreActual);

  const currentSysYear = new Date().getFullYear();
  const [anioActual, setAnioActual] = useState(currentSysYear >= 2026 ? currentSysYear : 2026);
  const anioTope = Math.max(2026, currentSysYear) + 1;
  const aniosDisponibles = Array.from({ length: anioTope - 2026 + 1 }, (_, i) => 2026 + i);
  const trimestreActualSistema = obtenerTrimestreActual();
  const maxTrimestrePermitido = anioActual < currentSysYear
    ? 4
    : anioActual === currentSysYear
      ? Number(trimestreActualSistema)
      : 0;

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
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
    selectedColegioRef.current = selectedColegio;
  }, [selectedColegio]);

  useEffect(() => {
    if (anioActual > currentSysYear) {
      setAnioActual(currentSysYear >= 2026 ? currentSysYear : 2026);
      return;
    }

    if (Number(trimestreSeleccionado) > maxTrimestrePermitido) {
      setTrimestreSeleccionado(String(maxTrimestrePermitido || 1));
    }
  }, [anioActual, currentSysYear, maxTrimestrePermitido, trimestreSeleccionado]);

  useEffect(() => {
    const handleBrowserBack = () => {
      if (selectedColegioRef.current) {
        setSelectedColegio(null);
        setActiveView('explorador');
      }
    };

    window.addEventListener('popstate', handleBrowserBack);
    return () => window.removeEventListener('popstate', handleBrowserBack);
  }, []);

  const { colegios, setColegios, loading, error } = useEspecialistaColegios({
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

  const handleSelectColegio = (colegio) => {
    if (!selectedColegioRef.current) {
      window.history.pushState(
        {
          ...(window.history.state || {}),
          subView: COLEGIO_DETALLE_HISTORY_STATE
        },
        '',
        window.location.href
      );
    }

    setActiveView('explorador');
    setSelectedColegio(colegio);
  };

  const handleColegioEstadoChange = (directorId, estado) => {
    setSelectedColegio((prev) => (
      prev && prev.id === directorId ? { ...prev, estado } : prev
    ));
    setColegios((prev) => prev.map((colegio) => (
      colegio.id === directorId ? { ...colegio, estado } : colegio
    )));
  };

  const handleBackToExplorador = () => {
    if (window.history.state?.subView === COLEGIO_DETALLE_HISTORY_STATE) {
      window.history.back();
      return;
    }

    setSelectedColegio(null);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <EspecialistaSidebar
        activeView={activeView}
        user={user}
        onChangeView={handleChangeView}
        onLogout={() => setIsLogoutModalOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
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
        ) : activeView === 'dataset-ml' ? (
          <EspecialistaDatasetMLView
            anioActual={anioActual}
            aniosDisponibles={aniosDisponibles}
            trimestreSeleccionado={trimestreSeleccionado}
            onAnioChange={setAnioActual}
            onTrimestreChange={setTrimestreSeleccionado}
            showToast={showToast}
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
          />
        ) : selectedColegio ? (
          <ColegioDetalle
            colegio={selectedColegio}
            onBack={handleBackToExplorador}
            trimestre={trimestreSeleccionado}
            anio={anioActual}
            onEstadoChange={handleColegioEstadoChange}
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
            onSelectColegio={handleSelectColegio}
          />
        )}

        <FloatingThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />

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
