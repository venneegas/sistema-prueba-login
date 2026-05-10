import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FolderOpen, UploadCloud, LogOut, Settings, Key, Moon, Sun, HelpCircle, UserMinus, User } from 'lucide-react';

const DirectorSidebar = ({ activeTab, setActiveTab, onLogoutClick, onChangePasswordClick, onRequestReplacementClick, user }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Cargar preferencia desde localStorage o si el SO está en modo oscuro
    const isDark = localStorage.getItem('theme') === 'dark' || 
                   (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Las opciones de tu menú actual
  const menuItems = [
    { id: 'general', label: 'CONSOLIDADO', icon: <LayoutDashboard size={18} /> },
    { id: 'ingresos', label: 'INGRESOS', icon: <FolderOpen size={18} /> },
    { id: 'egresos', label: 'EGRESOS', icon: <FolderOpen size={18} /> },
    { id: 'facturas', label: 'SUBIR PDF', icon: <UploadCloud size={18} /> },
    { id: 'informacion', label: 'INFORMACIÓN GENERAL', icon: <LayoutDashboard size={18} /> },
  ];

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
    setIsSettingsOpen(false); // Cierra el popover al cambiar el tema
  };

  return (
    <aside className="w-64 bg-slate-900 text-white h-full flex flex-col shadow-xl z-20 border-r border-slate-700">
      {/* Header con Logo Institucional */}
      <div className="p-6 border-b border-slate-800 text-center flex justify-center bg-slate-900">
        <img 
          src="/logo_ugel.svg" 
          alt="Logo UGEL" 
          className="h-16 w-auto object-contain drop-shadow-md bg-white/10 rounded-xl p-2" 
          onError={(e) => { e.target.style.display = 'none' }}
        />
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-xl text-sm text-left transition-colors shadow-sm ${
              activeTab === item.id
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white font-semibold'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Sección Inferior - Cerrar Sesión */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 relative">
        
        {/* Popover de Configuración */}
        {isSettingsOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-800 rounded-xl shadow-xl border border-slate-700 overflow-hidden z-50">
            <div className="p-2 space-y-1">
              <button
                onClick={() => {
                  onChangePasswordClick();
                  setIsSettingsOpen(false);
                }}
                className="w-full flex items-center justify-start space-x-3 px-3 py-2.5 rounded-lg text-sm text-left text-slate-200 hover:bg-slate-700 hover:text-white transition-colors font-medium"
              >
                <Key size={16} className="text-slate-400" />
                <span>Cambiar Contraseña</span>
              </button>
              <button
                onClick={() => {
                  onRequestReplacementClick();
                  setIsSettingsOpen(false);
                }}
                className="w-full flex items-center justify-start space-x-3 px-3 py-2.5 rounded-lg text-sm text-left text-slate-200 hover:bg-slate-700 hover:text-white transition-colors font-medium"
              >
                <UserMinus size={16} className="text-slate-400" />
                <span>Solicitar Reemplazo de Director</span>
              </button>
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-start space-x-3 px-3 py-2.5 rounded-lg text-sm text-left text-slate-200 hover:bg-slate-700 hover:text-white transition-colors font-medium"
              >
                {isDarkMode ? <Sun size={16} className="text-slate-400" /> : <Moon size={16} className="text-slate-400" />}
                <span>{isDarkMode ? 'Tema: Claro' : 'Tema: Oscuro'}</span>
              </button>
              <button
                onClick={() => {
                  alert("SOPORTE TÉCNICO UGEL\n\n📞 Teléfono: (043) 314615 - Anexo 102\n✉️ Correo: soporte.sistemas@ugel.edu.pe\n🕒 Horario: Lunes a Viernes de 8:00 AM a 5:00 PM\n\nComunícate con nosotros si tienes problemas para subir tus sustentos o cambiar tu contraseña.");
                  setIsSettingsOpen(false);
                }}
                className="w-full flex items-center justify-start space-x-3 px-3 py-2.5 rounded-lg text-sm text-left text-slate-200 hover:bg-slate-700 hover:text-white transition-colors border-t border-slate-700 mt-1 pt-2.5 font-medium"
              >
                <HelpCircle size={16} className="text-slate-400" />
                <span>Soporte Técnico</span>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={`w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-xl text-sm text-left transition-colors mb-4 ${
            isSettingsOpen ? 'bg-slate-800 text-white font-bold' : 'text-slate-300 hover:bg-slate-800 hover:text-white font-semibold'
          }`}
        >
          <Settings size={18} />
          <span>Configuración</span>
        </button>

        {/* Info del Usuario */}
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-600 shrink-0">
            <User size={20} className="text-slate-300" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate text-white">
              {(() => {
                let nom = (user?.director?.nombres || user?.nombre || '').replace(/^Usuario\s+/i, '').trim();
                let ape = (user?.director?.apellido_paterno || user?.apellido || '').trim();
                
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
            <p className="text-xs font-medium text-slate-400 truncate text-ellipsis">
              {user?.director?.school || user?.colegio || 'Institución Educativa'}
            </p>
          </div>
        </div>

        <button 
          onClick={onLogoutClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-colors font-bold text-sm"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default DirectorSidebar;
