import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  UploadCloud,
  LogOut,
  Key,
  Moon,
  Sun,
  HelpCircle,
  UserMinus,
  User,
  WalletCards,
  X,
  Phone,
  Mail,
  Clock,
  UserRound,
} from 'lucide-react';

const DirectorSidebar = ({
  activeTab,
  setActiveTab,
  onLogoutClick,
  onChangePasswordClick,
  onRequestReplacementClick,
  user,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSoporteOpen, setIsSoporteOpen] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark'
      || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const movimientoItems = [
    { id: 'general', label: 'CONSOLIDADO', icon: <LayoutDashboard size={18} /> },
    { id: 'ingresos', label: 'INGRESOS', icon: <FolderOpen size={18} /> },
    { id: 'egresos', label: 'EGRESOS', icon: <FolderOpen size={18} /> },
    { id: 'facturas', label: 'SUBIR PDF', icon: <UploadCloud size={18} /> },
  ];

  const datosItems = [
    { id: 'informacion', label: 'PERFIL', icon: <UserRound size={18} /> },
    { id: 'tesorero', label: 'TESORERO', icon: <User size={18} /> },
    { id: 'cuenta', label: 'CUENTA', icon: <WalletCards size={18} /> },
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
  };

  const configButtonClass = 'group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left text-sm font-bold text-slate-700 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/80 hover:text-blue-700 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white';
  const configIconClass = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-white group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300';

  const sectionLabelClass = 'px-4 pt-4 pb-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500';

  const renderNavItem = (item) => (
    <button
      key={item.id}
      type="button"
      onClick={() => setActiveTab(item.id)}
      className={`group relative w-full flex items-center justify-start gap-3 overflow-hidden px-4 py-3 rounded-xl text-sm text-left transition-all duration-200 ${
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
      <span>{item.label}</span>
    </button>
  );

  return (
    <aside className="w-64 bg-white dark:bg-[#07111f] text-slate-800 dark:text-white h-full flex flex-col shadow-[10px_0_35px_-28px_rgba(15,23,42,0.9)] z-20 border-r border-slate-200 dark:border-slate-800">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 text-center flex justify-center bg-white dark:bg-[#07111f]">
        <img
          src="https://ugelsanta.gob.pe/wp-content/uploads/2026/02/Logo_US3.png"
          alt="Logo UGEL"
          className="h-16 w-auto object-contain drop-shadow-sm"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Logo+UGEL'; }}
        />
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <p className={sectionLabelClass}>Movimientos</p>
        {movimientoItems.map(renderNavItem)}

        <p className={sectionLabelClass}>Datos</p>
        {datosItems.map(renderNavItem)}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#091426] relative">
        <div className="mb-4 space-y-2">
          <p className="px-1 text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
            Configuracion
          </p>

          <button
            type="button"
            onClick={onRequestReplacementClick}
            className={configButtonClass}
          >
            <span className={configIconClass}><UserMinus size={18} /></span>
            <span>Solicitud</span>
          </button>

          <button
            type="button"
            onClick={onChangePasswordClick}
            className={configButtonClass}
          >
            <span className={configIconClass}><Key size={18} /></span>
            <span>Credenciales</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              <span>Tema</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSoporteOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <HelpCircle size={16} />
              <span>Soporte</span>
            </button>
          </div>
        </div>

        {isSoporteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <HelpCircle className="text-blue-500" size={20} />
                  Soporte Tecnico UGEL
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
                  Comunicate con nosotros si tienes problemas o consultas.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                      <Phone size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Telefono / WhatsApp</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">986675438</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Correo Electronico</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 break-all">recursos_propios_ie@ugelsanta.gob.pe</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Horario de Atencion</p>
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
        )}

        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-slate-800 flex items-center justify-center border-2 border-blue-200 dark:border-slate-600 shrink-0">
            <User size={20} className="text-blue-600 dark:text-slate-300" />
          </div>
          <div className="overflow-hidden">
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
              {user?.director?.school || user?.colegio || 'Institucion Educativa'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogoutClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white rounded-xl transition-colors font-bold text-sm"
        >
          <LogOut size={18} />
          <span>Cerrar Sesion</span>
        </button>
      </div>
    </aside>
  );
};

export default DirectorSidebar;
