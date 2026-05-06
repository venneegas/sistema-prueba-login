import React, { useState } from 'react';
import ColegioDetalle from './ColegioDetalle';
import ChangePasswordModal from '../ChangePasswordModal';
import EspecialistaSidebar from './EspecialistaSidebar';
import EspecialistaReportesView from './EspecialistaReportesView';
import EspecialistaConfiguracionView from './EspecialistaConfiguracionView';
import EspecialistaExploradorView from './EspecialistaExploradorView';
import EspecialistaSolicitudesPage from './EspecialistaSolicitudesPage';
import useEspecialistaColegios from '../../hooks/useEspecialistaColegios';
import useEspecialistaReporteGlobal from '../../hooks/useEspecialistaReporteGlobal';
import useEspecialistaStats from '../../hooks/useEspecialistaStats';
import exportEspecialistaReporte from '../../utils/exportEspecialistaReporte';

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
        alert('No hay datos disponibles para exportar en este periodo.');
        return;
      }

      await exportEspecialistaReporte({
        trimestreSeleccionado,
        anioActual,
        reporte: reporteGlobal
      });
    } catch (err) {
      console.error('Error exportando Excel:', err);
      alert('Ocurrio un error al generar el archivo Excel.');
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
    <div className="flex h-screen bg-slate-50">
      <EspecialistaSidebar
        activeView={activeView}
        user={user}
        onChangeView={handleChangeView}
        onLogout={onLogout}
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
      </main>
    </div>
  );
};

export default EspecialistaDashboard;
