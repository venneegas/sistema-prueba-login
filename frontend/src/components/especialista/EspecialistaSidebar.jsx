import React from 'react';
import { Key, LayoutDashboard, LogOut, PieChart, Settings, User, UserCheck, FileSpreadsheet } from 'lucide-react';

const menuItems = [
  { id: 'explorador', label: 'Explorador', icon: LayoutDashboard },
  { id: 'estadisticas', label: 'Estadísticas', icon: PieChart },
  { id: 'reportes', label: 'Reportes y Descargas', icon: FileSpreadsheet },
  { id: 'solicitudes', label: 'Solicitudes', icon: Key },
  { id: 'configuracion', label: 'Configuración', icon: Settings }
];

const EspecialistaSidebar = ({ activeView, user, onChangeView, onLogout }) => {
  return (
    <aside className="w-64 bg-blue-950 text-white flex flex-col shadow-xl z-20 border-r border-blue-800">
      <div className="p-6 border-b border-blue-900/50">
        <div className="flex items-center gap-3">
          <UserCheck className="text-blue-400" size={24} />
          <h2 className="text-xl font-bold text-blue-200 uppercase">Especialista</h2>
        </div>
        <p className="text-xs text-blue-400 mt-2 font-medium tracking-wide">Supervisión y Auditoría</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChangeView(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors shadow-sm ${
              activeView === id
                ? 'bg-blue-600 text-white'
                : 'text-blue-200 hover:bg-blue-900/50 hover:text-white'
            }`}
          >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-blue-900/50 bg-blue-950">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center border-2 border-blue-600">
            <User size={20} className="text-blue-200" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.nombre || 'Especialista'}</p>
            <p className="text-xs text-blue-400 truncate text-ellipsis">UGEL Sede</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-colors font-medium"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default EspecialistaSidebar;
