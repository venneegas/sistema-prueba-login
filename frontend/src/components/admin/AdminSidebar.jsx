import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Activity,
  Database,
  Gauge,
  Key,
  LogOut,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Server,
  Settings,
  ShieldCheck,
  Users
} from 'lucide-react';
import { UGEL_COMPACT_LOGO_SRC, UGEL_LOGO_SRC } from '../../config/assets';

const systemItems = [
  {
    id: 'control',
    label: 'CONTROL UGEL',
    description: 'Resumen, periodos, instituciones, asignaciones y credenciales.',
    icon: Gauge
  },
  {
    id: 'database',
    label: 'BASE DE DATOS',
    description: 'Descarga copias de seguridad y revisa recursos críticos.',
    icon: Database
  },
  {
    id: 'usuarios',
    label: 'USUARIOS',
    description: 'Crea, edita y suspende cuentas del sistema.',
    icon: Users
  },
  {
    id: 'flujos',
    label: 'FLUJOS',
    description: 'Consulta los recorridos operativos del sistema.',
    icon: Network
  }
];

const auditItems = [
  {
    id: 'sesiones',
    label: 'SESIONES',
    description: 'Revisa inicios de sesión exitosos y fallidos.',
    icon: Key
  },
  {
    id: 'auditoria',
    label: 'AUDITORIA',
    description: 'Consulta acciones registradas por usuario y módulo.',
    icon: Activity
  }
];

const configItems = [
  {
    id: 'seguridad',
    label: 'SEGURIDAD',
    description: 'Parámetros de protección y endurecimiento del sistema.',
    icon: ShieldCheck
  },
  {
    id: 'configuracion',
    label: 'CONFIGURACION',
    description: 'Ajustes generales del sistema.',
    icon: Settings
  }
];

const AdminSidebar = ({
  activeTab,
  user,
  onChangeTab,
  onLogout,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [tooltipData, setTooltipData] = useState(null);

  const sectionLabelClass = 'px-4 pt-4 pb-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-200/60';

  const showTooltip = (event, item) => {
    if (!isCollapsed || !item.description) return;

    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipData({
      id: item.id,
      label: item.label,
      description: item.description,
      top: rect.top + rect.height / 2,
      left: rect.right + 12
    });
  };

  const renderTooltipPortal = () => {
    if (!tooltipData) return null;

    return createPortal(
      <div
        className="pointer-events-none fixed z-[650] w-64 -translate-y-1/2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-[0_18px_45px_-22px_rgba(15,23,42,0.6)] transition-opacity duration-150 dark:border-slate-700 dark:bg-slate-900"
        style={{ top: tooltipData.top, left: tooltipData.left }}
      >
        <span className="block text-[11px] font-extrabold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
          {tooltipData.label}
        </span>
        <span className="mt-1 block text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">
          {tooltipData.description}
        </span>
      </div>,
      document.body
    );
  };

  const renderSidebarAction = (item) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <div
        key={item.id}
        className="group/admin-sidebar-item relative"
        onMouseEnter={(event) => showTooltip(event, item)}
        onMouseLeave={() => setTooltipData(null)}
      >
        <button
          type="button"
          onClick={(event) => {
            setTooltipData(null);
            event.currentTarget.blur();
            onChangeTab(item.id);
          }}
          aria-label={item.description ? `${item.label}: ${item.description}` : item.label}
          className={`group relative flex w-full items-center overflow-hidden rounded-xl text-left text-sm transition-all duration-200 ${
            isCollapsed ? 'justify-center px-0 py-3' : 'justify-start gap-3 px-4 py-3'
          } ${
            isActive
              ? 'bg-white text-blue-950 shadow-lg shadow-blue-950/20 ring-1 ring-white/70'
              : 'text-sky-100 hover:bg-white/10 hover:text-white hover:shadow-sm'
          }`}
        >
          <span
            className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all duration-200 ${
              isActive ? 'bg-amber-400 opacity-100' : 'bg-sky-300 opacity-0 group-hover:opacity-100'
            }`}
          />
          <Icon
            size={18}
            className={`shrink-0 transition-transform duration-200 ${
              isActive ? 'translate-x-0.5 text-blue-700' : 'text-sky-200 group-hover:translate-x-0.5 group-hover:text-white'
            }`}
          />
          {!isCollapsed && <span className="font-bold">{item.label}</span>}
        </button>
      </div>
    );
  };

  const renderSection = (label, items) => (
    <>
      {isCollapsed ? (
        <div className="mx-2 my-3 h-px bg-white/10" />
      ) : (
        <p className={sectionLabelClass}>{label}</p>
      )}
      {items.map(renderSidebarAction)}
    </>
  );

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} relative z-20 flex h-screen min-h-0 shrink-0 flex-col overflow-hidden border-r border-blue-950 bg-[#061b3a] text-white shadow-[10px_0_35px_-28px_rgba(15,23,42,0.9)] transition-all duration-300`}>
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-4 h-52 w-52 rounded-full bg-blue-700/20 blur-3xl" />

      <div className={`${isCollapsed ? 'px-3 py-5' : 'p-6'} relative shrink-0 border-b border-white/10 text-center`}>
        <div className="flex justify-center">
          <img
            src={isCollapsed ? UGEL_COMPACT_LOGO_SRC : UGEL_LOGO_SRC}
            alt="Logo UGEL"
            className={`${isCollapsed ? 'mt-1 h-12 w-12 rounded-lg object-contain' : 'h-16 w-auto object-contain'} drop-shadow-sm transition-all duration-300`}
          />
        </div>
        {!isCollapsed && (
          <div className="mt-4 text-left">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-amber-300">
              <Server size={16} />
              Panel administrador
            </p>
            <p className="mt-1 text-xs font-medium text-sky-100/70">Gestión operativa y seguridad</p>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={`${isCollapsed ? 'right-1 top-1 h-7 w-7' : 'right-3 top-3 h-8 w-8'} absolute flex items-center justify-center rounded-lg text-sky-100/70 transition-all hover:bg-white/10 hover:text-white`}
          title={isCollapsed ? 'Expandir menu' : 'Contraer menu'}
        >
          {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav
        className={`director-sidebar-scrollbar ${isCollapsed ? 'p-3' : 'p-4'} relative min-h-0 flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden`}
        onScroll={() => setTooltipData(null)}
      >
        {renderSection('Sistema', systemItems)}
        {renderSection('Trazabilidad', auditItems)}
        {renderSection('Administracion', configItems)}
      </nav>

      <div className={`${isCollapsed ? 'p-3' : 'p-4'} relative shrink-0 border-t border-white/10 bg-blue-950/50`}>
        <div className={`${isCollapsed ? 'justify-center px-0' : 'gap-3 px-2'} mb-4 flex items-center`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-300/40 bg-white/10">
            <Server size={18} className="text-amber-300" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold text-white">{user?.nombre || 'Administrador'}</p>
              <p className="truncate text-xs font-medium text-sky-100/70">{user?.email || 'Cuenta admin'}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          title={isCollapsed ? 'Cerrar Sesion' : undefined}
          className={`flex w-full items-center justify-center gap-2 ${isCollapsed ? 'px-0 py-3' : 'px-4 py-2.5'} rounded-xl bg-red-500/15 text-red-100 transition-colors hover:bg-red-500 hover:text-white font-bold text-sm`}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Cerrar Sesion</span>}
        </button>
      </div>

      {renderTooltipPortal()}
    </aside>
  );
};

export default AdminSidebar;
