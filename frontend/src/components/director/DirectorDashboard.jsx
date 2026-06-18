import React, { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import DirectorSidebar from './DirectorSidebar';
import LogoutModal from '../LogoutModal';
import ChangePasswordModal from '../ChangePasswordModal';
import CerrarTrimestreModal from './CerrarTrimestreModal';
import SolicitudReemplazoModal from './SolicitudReemplazoModal';
import ConsolidadoView from './ConsolidadoView';
import InformacionGeneralView from './InformacionGeneralView';
import IngresosView from './IngresosView';
import EgresosView from './EgresosView';
import SubirPDFView from './SubirPDFView';
import EstadoReporteView from './EstadoReporteView';
import { buildApiUrl } from '../../config/api';
import useTheme from '../../hooks/useTheme';
import FloatingThemeToggle from '../FloatingThemeToggle';
import GlobalNoticeBanner from '../GlobalNoticeBanner';

const CIERRES_API_URL = buildApiUrl('/api/movimientos/cierres');

// Función para obtener la fecha límite del trimestre seleccionado
const obtenerFechaLimite = (trimestreId, anio) => {
  switch (String(trimestreId)) {
    case '1': return new Date(anio, 3, 30, 23, 59, 59); // 30 de Abril
    case '2': return new Date(anio, 6, 31, 23, 59, 59); // 31 de Julio
    case '3': return new Date(anio, 9, 31, 23, 59, 59); // 31 de Octubre
    case '4': return new Date(anio + 1, 0, 31, 23, 59, 59); // 31 de Enero (próximo año)
    default: return new Date(anio, 11, 31, 23, 59, 59);
  }
};

const leerRespuestaJson = async (response) => {
  const rawText = await response.text();

  try {
    return rawText ? JSON.parse(rawText) : {};
  } catch (error) {
    throw new Error('La respuesta del servidor no tiene un formato JSON valido.');
  }
};

const DirectorDashboard = ({ user, onLogout, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState('general');
  const obtenerTrimestreActual = () => {
    const mesActual = new Date().getMonth();
    return String(Math.floor(mesActual / 3) + 1);
  };
  const [trimestreId, setTrimestreId] = useState(obtenerTrimestreActual);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isCerrarTrimestreOpen, setIsCerrarTrimestreOpen] = useState(false);
  const [isSolicitudReemplazoOpen, setIsSolicitudReemplazoOpen] = useState(false);
  const [trimestreCerrado, setTrimestreCerrado] = useState(false);
  const [cerrandoTrimestre, setCerrandoTrimestre] = useState(false);
  const [cerradoEn, setCerradoEn] = useState(null);
  const [estadoReporte, setEstadoReporte] = useState(null);
  const [mensajeCierre, setMensajeCierre] = useState('');
  const [errorCierre, setErrorCierre] = useState('');
  const [fechaLimiteAdmin, setFechaLimiteAdmin] = useState(null);
  const [avisosGlobales, setAvisosGlobales] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const dropdownRef = useRef(null);

  const cambioObligatorioPendiente = Boolean(user?.debeCambiarPassword);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const periodos = {
    '1': ['Enero', 'Febrero', 'Marzo'],
    '2': ['Abril', 'Mayo', 'Junio'],
    '3': ['Julio', 'Agosto', 'Septiembre'],
    '4': ['Octubre', 'Noviembre', 'Diciembre'],
  };

  const currentSysYear = new Date().getFullYear();
  const trimestreActualSistema = obtenerTrimestreActual();
  const [anioActual, setAnioActual] = useState(currentSysYear >= 2026 ? currentSysYear : 2026);
  
  const anioTope = Math.max(2026, currentSysYear) + 1; // Un año al futuro por si acaso
  const aniosDisponibles = Array.from({ length: anioTope - 2026 + 1 }, (_, i) => 2026 + i);
  const trimestresDisponibles = [
    { id: '1', label: '1º Trimestre' },
    { id: '2', label: '2º Trimestre' },
    { id: '3', label: '3º Trimestre' },
    { id: '4', label: '4º Trimestre' },
  ];
  const maxTrimestrePermitido = anioActual < currentSysYear
    ? 4
    : anioActual === currentSysYear
      ? Number(trimestreActualSistema)
      : 0;
  
  // Cálculos en tiempo real para las fechas de cierre
  const fechaLimite = fechaLimiteAdmin ? new Date(fechaLimiteAdmin) : obtenerFechaLimite(trimestreId, anioActual);
  const ahora = new Date();
  const diferenciaMs = fechaLimite.getTime() - ahora.getTime();
  const diasRestantes = diferenciaMs > 0 ? Math.ceil(diferenciaMs / (1000 * 3600 * 24)) : 0;
  const autoCerrado = diferenciaMs <= 0;

  const esCerradoFinal = trimestreCerrado || autoCerrado;
  const mensajeCierreEfectivo = autoCerrado && !trimestreCerrado 
    ? 'Este trimestre se ha cerrado automáticamente por haber superado la fecha límite.' 
    : mensajeCierre;

  // 1. Obtener notificaciones de la BD
  useEffect(() => {
    const fetchNotificaciones = async () => {
      try {
        const id = user.director?.id || user.id;
        const response = await fetch(buildApiUrl(`/api/notificaciones/${id}`));
        const data = await response.json();
        if (data.success) {
          setNotificaciones(data.notificaciones);
        }
      } catch (error) {
        console.error("Error al obtener notificaciones:", error);
      }
    };
    if (user) fetchNotificaciones();
  }, [user]);

  const unreadCount = notificaciones.filter(n => !n.leida).length;

  // 2. Abrir/Cerrar y marcar como leídas
  const toggleNotificaciones = async () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    
    // Si estamos abriendo el panel y hay no leídas, avisamos a la BD
    if (!isNotificationsOpen && unreadCount > 0) {
      try {
        const id = user.director?.id || user.id;
        await fetch(buildApiUrl(`/api/notificaciones/${id}/leidas`), { method: 'PUT' });
        
        // Actualizamos estado local
        setNotificaciones(notificaciones.map(n => ({ ...n, leida: true })));
      } catch (error) {
        console.error("Error al marcar como leídas:", error);
      }
    }
  };

  // 3. Cerrar panel al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Referencia estable a la función de logout
  const onLogoutRef = useRef(onLogout);
  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  // Interceptor Global de Fetch: Detecta tokens expirados (Error 401)
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      // Si el backend nos rechaza la petición por token inválido o expirado
      if (response.status === 401 && localStorage.getItem('token')) {
        alert('Tu sesión ha expirado por motivos de seguridad. Por favor, inicia sesión nuevamente.');
        onLogoutRef.current(); // Expulsar al usuario inmediatamente
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch; // Restaurar el fetch original al salir
    };
  }, []);

  useEffect(() => {
    if (cambioObligatorioPendiente) {
      setIsChangePasswordOpen(true);
    }
  }, [cambioObligatorioPendiente]);

  useEffect(() => {
    if (anioActual > currentSysYear) {
      setAnioActual(currentSysYear >= 2026 ? currentSysYear : 2026);
      return;
    }

    if (Number(trimestreId) > maxTrimestrePermitido) {
      setTrimestreId(String(maxTrimestrePermitido || 1));
    }
  }, [anioActual, currentSysYear, maxTrimestrePermitido, trimestreId]);

  useEffect(() => {
    const cargarEstadoCierre = async () => {
      if (!user.director?.id || !trimestreId || cambioObligatorioPendiente) return;

      setErrorCierre('');
      setMensajeCierre('');
      setEstadoReporte(null);

      try {
        const query = new URLSearchParams({
          directorId: String(user.director.id),
          anio: String(anioActual),
          trimestreId: String(trimestreId),
        });

        const response = await fetch(`${CIERRES_API_URL}/estado?${query.toString()}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await leerRespuestaJson(response);

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'No se pudo consultar el cierre del trimestre.');
        }

        setTrimestreCerrado(Boolean(data.data?.trimestreCerrado));
        setCerradoEn(data.data?.cerradoEn || null);
        setEstadoReporte(data.data?.estadoReporte || null);
      } catch (loadError) {
        console.error(loadError);
        setErrorCierre(loadError.message || 'No se pudo consultar el cierre del trimestre.');
      }
    };

    cargarEstadoCierre();
  }, [anioActual, trimestreId, user.director?.id, cambioObligatorioPendiente]);

  useEffect(() => {
    const cargarConfigPeriodo = async () => {
      if (!anioActual || !trimestreId || !user.director?.id || cambioObligatorioPendiente) return;

      try {
        setFechaLimiteAdmin(null);
        const query = new URLSearchParams({
          anio: String(anioActual),
          trimestreId: String(trimestreId),
          directorId: String(user.director.id),
        });
        const response = await fetch(`${buildApiUrl('/api/movimientos/periodos/config')}?${query.toString()}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await leerRespuestaJson(response);

        if (response.ok && data.success) {
          setFechaLimiteAdmin(data.data?.fechaLimite || null);
        }
      } catch (configError) {
        console.error('No se pudo cargar la configuracion del periodo:', configError);
        setFechaLimiteAdmin(null);
      }
    };

    cargarConfigPeriodo();
  }, [anioActual, trimestreId, user.director?.id, cambioObligatorioPendiente]);

  useEffect(() => {
    const cargarAvisosGlobales = async () => {
      if (cambioObligatorioPendiente) return;

      try {
        const response = await fetch(buildApiUrl('/api/admin/avisos/activos?rol=director'), {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await leerRespuestaJson(response);
        if (response.ok && data.success) {
          setAvisosGlobales(data.data || []);
        }
      } catch (noticeError) {
        console.error('No se pudieron cargar los avisos globales:', noticeError);
      }
    };

    cargarAvisosGlobales();
  }, [cambioObligatorioPendiente]);

  const handleCerrarTrimestre = async () => {
    if (trimestreCerrado || !user.director?.id || cambioObligatorioPendiente) return;

    setCerrandoTrimestre(true);
    setErrorCierre('');
    setMensajeCierre('');

    try {
      const response = await fetch(CIERRES_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          directorId: user.director.id,
          anio: anioActual,
          trimestreId,
        }),
      });

      const data = await leerRespuestaJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo cerrar el trimestre.');
      }

      setTrimestreCerrado(true);
      setCerradoEn(data.data?.cerradoEn || new Date().toISOString());
      setEstadoReporte(data.data?.estadoReporte || { estado: 'Enviado' });
      setMensajeCierre('El trimestre fue cerrado y ya no admite cambios.');
      setIsCerrarTrimestreOpen(false);
    } catch (closeError) {
      console.error(closeError);
      setErrorCierre(closeError.message || 'No se pudo cerrar el trimestre.');
    } finally {
      setCerrandoTrimestre(false);
    }
  };

  const handlePasswordChanged = (updatedUser) => {
    setIsChangePasswordOpen(false);

    if (updatedUser) {
      onUserUpdate?.(updatedUser);
    } else {
      onUserUpdate?.({ ...user, debeCambiarPassword: false });
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-[#111827]">
      <DirectorSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogoutClick={() => setIsLogoutModalOpen(true)}
        onChangePasswordClick={() => setIsChangePasswordOpen(true)}
        onRequestReplacementClick={() => setIsSolicitudReemplazoOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        user={user}
      />

      <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.08),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef3f8_100%)] p-8 dark:bg-none dark:bg-[#111827]">
        <div className="mx-auto max-w-7xl">
        <div className="relative z-[200] mb-6 flex flex-col gap-4 bg-white/90 dark:bg-slate-800/95 p-5 rounded-2xl shadow-[0_14px_40px_-28px_rgba(15,23,42,0.8)] border border-slate-200/80 dark:border-slate-700 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">
              Panel de Director
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
              {user.director?.school || 'N/A'}
            </h1>
            {cambioObligatorioPendiente && (
              <p className="text-sm text-amber-700 mt-1">
                Debes cambiar tu contraseña temporal antes de usar el sistema.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
      <select
        value={anioActual}
        onChange={(e) => setAnioActual(Number(e.target.value))}
        disabled={cambioObligatorioPendiente}
        className="bg-blue-50 dark:bg-slate-700 border border-blue-200 dark:border-slate-600 text-blue-700 dark:text-slate-200 py-2 px-4 rounded-lg font-bold outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
      >
        {aniosDisponibles.map((anio) => (
          <option key={anio} value={anio} disabled={anio > currentSysYear}>{anio}</option>
        ))}
      </select>

            <select
              value={trimestreId}
              onChange={(e) => setTrimestreId(e.target.value)}
              disabled={cambioObligatorioPendiente}
              className="bg-blue-50 dark:bg-slate-700 border border-blue-200 dark:border-slate-600 text-blue-700 dark:text-slate-200 py-2 px-4 rounded-lg font-bold outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
            >
              {trimestresDisponibles.map((trimestre) => (
                <option
                  key={trimestre.id}
                  value={trimestre.id}
                  disabled={Number(trimestre.id) > maxTrimestrePermitido}
                >
                  {trimestre.label}
                </option>
              ))}
            </select>
            
            {/* Dropdown de Notificaciones (Alertas + BD) */}
            <div className="relative z-[220]" ref={dropdownRef}>
              <button
                type="button"
                onClick={toggleNotificaciones}
                className="relative p-2 text-gray-400 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-slate-200 rounded-full transition-colors focus:outline-none"
                title="Notificaciones"
              >
                <Bell size={22} />
                {(unreadCount > 0 || (diasRestantes > 0 && diasRestantes <= 15 && !trimestreCerrado)) && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 z-[230] mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Centro de Alertas</h3>
                    {unreadCount > 0 && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} nuevas
                      </span>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto p-4 space-y-4">
                    {/* --- ALERTA DEL SISTEMA (FECHAS LÍMITE) --- */}
                    {autoCerrado ? (
                      <div className="flex gap-3">
                        <div className="mt-0.5 text-red-500"><Bell size={18} /></div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Trimestre Finalizado</p>
                          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">El plazo venció el {fechaLimite.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}.</p>
                          <p className="text-xs font-bold text-red-600 mt-2">Sistema bloqueado automáticamente.</p>
                        </div>
                      </div>
                    ) : trimestreCerrado ? (
                      <div className="flex gap-3">
                        <div className="mt-0.5 text-emerald-500"><Bell size={18} /></div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Trimestre Cerrado</p>
                          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Has cerrado este trimestre manualmente. Todo está en orden.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <div className="mt-0.5 text-amber-500"><Bell size={18} /></div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Aviso de Cierre Próximo</p>
                          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                            Tienes hasta el <span className="font-bold">{fechaLimite.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</span> a las 11:59 PM para declarar tus sustentos.
                          </p>
                          <p className={`text-xs font-bold mt-2 ${diasRestantes <= 5 ? 'text-red-600' : 'text-amber-600'}`}>
                            ⏳ Te quedan {diasRestantes} días.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* --- NOTIFICACIONES DE LA BD (ESPECIALISTA) --- */}
                    {notificaciones.length > 0 && <div className="border-t border-slate-100 my-2 dark:border-slate-700"></div>}
                    
                    {notificaciones.map((notif) => (
                      <div key={notif.id} className={`flex gap-3 p-3 rounded-xl transition-colors ${!notif.leida ? 'bg-blue-50/50 dark:bg-blue-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/60'}`}>
                        <div className="mt-0.5">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${
                            notif.tipo === 'error' ? 'bg-rose-500' : 
                            notif.tipo === 'exito' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}></div>
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${
                            notif.tipo === 'error' ? 'text-rose-700 dark:text-rose-300' : 
                            notif.tipo === 'exito' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'
                          }`}>
                            {notif.titulo}
                          </p>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed dark:text-slate-300">{notif.mensaje}</p>
                          <p className="text-[10px] text-slate-400 mt-2 font-medium dark:text-slate-500">
                            {new Date(notif.fecha_creacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <GlobalNoticeBanner avisos={avisosGlobales} />

        {cambioObligatorioPendiente ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-900">
            <h2 className="text-lg font-bold mb-2">Cambio de contraseña pendiente</h2>
            <p>
              Ya ingresaste con la clave temporal. Antes de continuar, registra una nueva
              contraseña personal para completar tu primer acceso.
            </p>
          </div>
        ) : (
          <div key={activeTab} className="director-view-enter">
            {activeTab === 'general' && (
              <ConsolidadoView
                trimestreId={trimestreId}
          anio={anioActual}
                directorId={user.director?.id}
                schoolName={user.director?.school}
                numeroIE={user.director?.numero_ie}
                trimestreCerrado={esCerradoFinal}
                cerrandoTrimestre={cerrandoTrimestre}
                mensajeCierre={mensajeCierreEfectivo}
                errorCierre={errorCierre}
                cerradoEn={cerradoEn}
                onCerrarTrimestre={() => setIsCerrarTrimestreOpen(true)}
              />
            )}

            {activeTab === 'ingresos' && (
              <IngresosView
                trimestreMeses={periodos[trimestreId]}
                trimestreId={trimestreId}
        anio={anioActual}
                directorId={user.director?.id}
                trimestreCerrado={esCerradoFinal}
                schoolName={user.director?.school}
              />
            )}

            {activeTab === 'egresos' && (
              <EgresosView
                trimestreMeses={periodos[trimestreId]}
                trimestreId={trimestreId}
        anio={anioActual}
                directorId={user.director?.id}
                trimestreCerrado={esCerradoFinal}
                schoolName={user.director?.school}
              />
            )}

            {activeTab === 'facturas' && (
              <SubirPDFView
                trimestreMeses={periodos[trimestreId]}
                trimestreId={trimestreId}
        anio={anioActual}
                directorId={user.director?.id}
                trimestreCerrado={esCerradoFinal}
              />
            )}

            {activeTab === 'estado-reporte' && (
              <EstadoReporteView
                trimestreId={trimestreId}
                anio={anioActual}
                trimestreCerrado={esCerradoFinal}
                mensajeCierre={mensajeCierreEfectivo}
                errorCierre={errorCierre}
                cerradoEn={cerradoEn}
                estadoReporte={estadoReporte}
              />
            )}

            {activeTab === 'informacion' && <InformacionGeneralView director={user.director} section="perfil" />}
            {activeTab === 'tesoreria' && <InformacionGeneralView director={user.director} section="tesoreria" />}
          </div>
        )}
        </div>

        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={onLogout}
        />

        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => {
            if (!cambioObligatorioPendiente) {
              setIsChangePasswordOpen(false);
            }
          }}
          mode={cambioObligatorioPendiente ? 'required' : 'optional'}
          onPasswordChanged={handlePasswordChanged}
        />

        <CerrarTrimestreModal
          isOpen={isCerrarTrimestreOpen}
          onClose={() => {
            if (!cerrandoTrimestre) setIsCerrarTrimestreOpen(false);
          }}
          onConfirm={handleCerrarTrimestre}
          loading={cerrandoTrimestre}
        />

      <SolicitudReemplazoModal
        isOpen={isSolicitudReemplazoOpen}
        onClose={() => setIsSolicitudReemplazoOpen(false)}
        director={user.director}
      />
      {!cambioObligatorioPendiente && (
        <FloatingThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
      )}
      </main>
    </div>
  );
};

export default DirectorDashboard;
