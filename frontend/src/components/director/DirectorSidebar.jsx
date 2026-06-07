import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  FolderOpen,
  UploadCloud,
  LogOut,
  Key,
  HelpCircle,
  UserMinus,
  User,
  WalletCards,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Mail,
  Clock,
  UserRound,
  FileCheck2,
} from 'lucide-react';

const DirectorSidebar = ({
  activeTab,
  setActiveTab,
  onLogoutClick,
  onChangePasswordClick,
  onRequestReplacementClick,
  isCollapsed = false,
  onToggleCollapse,
  user,
}) => {
  const [isSoporteOpen, setIsSoporteOpen] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);

  const movimientoItems = [
    { id: 'general', label: 'CONSOLIDADO', description: 'Revisa el resumen trimestral de ingresos, egresos y saldo.', icon: <LayoutDashboard size={18} /> },
    { id: 'ingresos', label: 'INGRESOS', description: 'Registra y consulta los ingresos del trimestre.', icon: <FolderOpen size={18} /> },
    { id: 'egresos', label: 'EGRESOS', description: 'Registra y consulta los egresos sustentados.', icon: <FolderOpen size={18} /> },
    { id: 'facturas', label: 'SUBIR PDF', description: 'Adjunta los sustentos PDF para su revisión.', icon: <UploadCloud size={18} /> },
    { id: 'estado-reporte', label: 'ESTADO REPORTE', description: 'Consulta la trazabilidad y estado actual del reporte trimestral.', icon: <FileCheck2 size={18} /> },
  ];

  const datosItems = [
    { id: 'informacion', label: 'DIRECCIÓN', description: 'Consulta los datos del director y de la institución educativa.', icon: <UserRound size={18} /> },
    { id: 'tesoreria', label: 'TESORERIA', description: 'Registra datos del tesorero y cuenta corriente.', icon: <WalletCards size={18} /> },
  ];

  const sectionLabelClass = 'px-4 pt-4 pb-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500';

  const showTooltip = (event, item) => {
    if (!item.description) return;

    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipData({
      id: item.id,
      label: item.label,
      description: item.description,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const renderTooltipPortal = () => {
    if (!tooltipData) return null;

    return createPortal(
      <div
        className="pointer-events-none fixed z-[650] w-64 -translate-y-1/2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left opacity-100 shadow-[0_18px_45px_-22px_rgba(15,23,42,0.6)] transition-opacity duration-150 dark:border-slate-700 dark:bg-slate-900"
        style={{ top: tooltipData.top, left: tooltipData.left }}
      >
        <span className="block text-[11px] font-extrabold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">
          {tooltipData.label}
        </span>
        <span className="mt-1 block text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">
          {tooltipData.description}
        </span>
      </div>,
      document.body
    );
  };

  const renderSidebarAction = (item) => (
    <div
      key={item.id}
      className="group/sidebar-item relative"
      onMouseEnter={(event) => showTooltip(event, item)}
      onMouseLeave={() => setTooltipData(null)}
    >
      <button
        type="button"
        onClick={(event) => {
          setTooltipData(null);
          event.currentTarget.blur();
          if (item.onClick) {
            item.onClick();
            return;
          }
          setActiveTab(item.id);
        }}
        aria-label={item.description ? `${item.label}: ${item.description}` : item.label}
        className={`group relative w-full flex items-center overflow-hidden rounded-xl text-sm text-left transition-all duration-200 ${
          isCollapsed ? 'justify-center px-0 py-3' : 'justify-start gap-3 px-4 py-3'
        } ${
          activeTab === item.id
            ? 'bg-blue-50 text-blue-700 font-bold shadow-sm ring-1 ring-blue-100 dark:bg-blue-600 dark:text-white dark:ring-blue-500/40'
            : 'text-slate-600 hover:bg-blue-50/80 hover:text-blue-700 hover:shadow-sm font-semibold dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
        }`}
      >
        <span
          className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all duration-200 ${
            activeTab === item.id ? 'bg-blue-600 opacity-100' : 'bg-blue-500 opacity-0 group-hover:opacity-100'
          }`}
        />
        <span className={`shrink-0 transition-transform duration-200 ${activeTab === item.id ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'}`}>
          {item.icon}
        </span>
        {!isCollapsed && <span>{item.label}</span>}
      </button>
    </div>
  );

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-[#07111f] text-slate-800 dark:text-white h-screen min-h-0 shrink-0 flex flex-col shadow-[10px_0_35px_-28px_rgba(15,23,42,0.9)] z-20 border-r border-slate-200 dark:border-slate-800 transition-all duration-300`}>
      <div className={`${isCollapsed ? 'px-3 py-5' : 'p-6'} relative shrink-0 border-b border-slate-200 dark:border-slate-800 text-center flex justify-center bg-white dark:bg-[#07111f]`}>
        <img
          src="https://ugelsanta.gob.pe/wp-content/uploads/2026/02/Logo_US3.png"
          alt="Logo UGEL"
          className={`${isCollapsed ? 'mt-1 h-10 w-12 object-contain' : 'h-16 w-auto object-contain'} drop-shadow-sm transition-all duration-300`}
          onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Logo+UGEL'; }}
        />
        <button
          type="button"
          onClick={onToggleCollapse}
          className={`${isCollapsed ? 'right-1 top-1 h-7 w-7' : 'right-3 top-3 h-8 w-8'} absolute flex items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-white`}
          title={isCollapsed ? 'Expandir menu' : 'Contraer menu'}
        >
          {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav
        className={`director-sidebar-scrollbar ${isCollapsed ? 'p-3' : 'p-4'} min-h-0 flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden`}
        onScroll={() => setTooltipData(null)}
      >
        {!isCollapsed && <p className={sectionLabelClass}>Información Económica</p>}
        {movimientoItems.map(renderSidebarAction)}

        {!isCollapsed && <p className={sectionLabelClass}>Datos de Responsables</p>}
        {datosItems.map(renderSidebarAction)}

        {!isCollapsed && <p className={sectionLabelClass}>Configuración</p>}
        {[
          { id: 'solicitud', label: 'SOLICITUD', description: 'Solicita el reemplazo del director o responsable registrado.', icon: <UserMinus size={18} />, onClick: onRequestReplacementClick },
          { id: 'credenciales', label: 'CREDENCIALES', description: 'Cambia la contraseña de acceso de tu cuenta.', icon: <Key size={18} />, onClick: onChangePasswordClick },
          { id: 'soporte', label: 'SOPORTE', description: 'Consulta teléfono, correo y horario de atención UGEL.', icon: <HelpCircle size={18} />, onClick: () => setIsSoporteOpen(true) },
        ].map(renderSidebarAction)}
      </nav>

      <div className={`${isCollapsed ? 'p-3' : 'p-4'} shrink-0 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#091426] relative`}>

        {isSoporteOpen && createPortal((
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <HelpCircle className="text-blue-500" size={20} />
                  Soporte Técnico UGEL
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSoporteOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 font-medium">
                  Comunícate con nosotros si tienes problemas o consultas.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                      <Phone size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Teléfono / WhatsApp</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">986675438</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Correo Electrónico</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 break-all">recursos_propios_ie@ugelsanta.gob.pe</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Horario de Atención</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Lunes a Viernes de 8:00 AM a 5:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex justify-end bg-slate-50 dark:bg-slate-800/50">
                <button
                  type="button"
                  onClick={() => setIsSoporteOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        ), document.body)}

        <div className={`${isCollapsed ? 'justify-center px-0' : 'gap-3 px-2'} flex items-center mb-4`}>
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-slate-800 flex items-center justify-center border-2 border-blue-200 dark:border-slate-600 shrink-0">
            <User size={20} className="text-blue-600 dark:text-slate-300" />
          </div>
          {!isCollapsed && <div className="overflow-hidden">
            <p className="text-sm font-bold truncate text-slate-800 dark:text-white">
              {(() => {
                const nom = (user?.director?.nombres || user?.nombre || '').replace(/^Usuario\s+/i, '').trim();
                const ape = (user?.director?.apellido_paterno || user?.apellido || '').trim();

                if (!nom && !ape) return 'Director';

                const primerNombre = nom.split(/\s+/)[0];
                const primerApellido = ape.split(/\s+/)[0];

                if (primerNombre && primerApellido) {
                  return `${primerNombre} ${primerApellido}`;
                }

                const nombres = nom.split(/\s+/);
                return nombres.length > 1 ? `${nombres[0]} ${nombres[1]}` : primerNombre;
              })()}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate text-ellipsis">
              {user?.director?.school || user?.colegio || 'Institución Educativa'}
            </p>
          </div>}
        </div>

        <button
          type="button"
          onClick={onLogoutClick}
          title={isCollapsed ? 'Cerrar Sesión' : undefined}
          className={`w-full flex items-center justify-center gap-2 ${isCollapsed ? 'px-0 py-3' : 'px-4 py-2.5'} bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white rounded-xl transition-colors font-bold text-sm`}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
      {renderTooltipPortal()}
    </aside>
  );
};

export default DirectorSidebar;
