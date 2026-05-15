import React, { useState, useEffect } from 'react';
import ColegioDetalle from './ColegioDetalle';
import ChangePasswordModal from '../ChangePasswordModal';
import LogoutModal from '../LogoutModal';
import EspecialistaSidebar from './EspecialistaSidebar';
import EspecialistaReportesView from './EspecialistaReportesView';
import EspecialistaConfiguracionView from './EspecialistaConfiguracionView';
import EspecialistaExploradorView from './EspecialistaExploradorView';
import EspecialistaSolicitudesPage from './EspecialistaSolicitudesPage';
import useEspecialistaColegios from '../../hooks/useEspecialistaColegios';
import useEspecialistaReporteGlobal from '../../hooks/useEspecialistaReporteGlobal';
import useEspecialistaStats from '../../hooks/useEspecialistaStats';
import exportEspecialistaReporte from '../../utils/exportEspecialistaReporte';
import { AlertCircle, Info } from 'lucide-react';

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

  const [isExporting, setIsExporting] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [modalMensaje, setModalMensaje] = useState(null);

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

  const handleExportarGlobal = async () => {
    try {
      setIsExporting(true);
      if (!reporteGlobal.length) {
        setModalMensaje({
          type: 'info',
          title: 'Sin datos',
          message: 'No hay datos financieros disponibles para exportar en este periodo.'
        });
        return;
      }

      await exportEspecialistaReporte({
        trimestreSeleccionado,
        anioActual,
        reporte: reporteGlobal
      });
    } catch (err) {
      console.error('Error exportando Excel:', err);
      setModalMensaje({
        type: 'error',
        title: 'Error de exportación',
        message: 'Ocurrió un error al generar el archivo Excel. Inténtalo nuevamente.'
      });
    } finally {
      setIsExporting(false);
    }
  };

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
        ) : activeView === 'reportes' ? (
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
            onExportarGlobal={handleExportarGlobal}
            isExporting={isExporting}
            reporteGlobal={reporteGlobal}
            reporteLoading={reporteLoading}
            reporteError={reporteError}
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

        {/* --- MODAL DE MENSAJES (INFO / ERROR) --- */}
        {modalMensaje && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-700">
              <div className="p-6 text-center">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${modalMensaje.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                  {modalMensaje.type === 'info' ? <Info size={32} /> : <AlertCircle size={32} />}
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  {modalMensaje.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  {modalMensaje.message}
                </p>
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-center">
                <button 
                  onClick={() => setModalMensaje(null)}
                  className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-colors w-full ${modalMensaje.type === 'info' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EspecialistaDashboard;
