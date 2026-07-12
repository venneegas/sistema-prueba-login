import React from 'react';
import { X, User, Mail, Phone, BadgeInfo } from 'lucide-react';

const DirectorInfoModal = ({ colegio, onClose }) => {
  if (!colegio) return null;

  const directorNombreCompleto = [colegio.directorNombres, colegio.directorApellidoPaterno, colegio.directorApellidoMaterno].filter(Boolean).join(' ');

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <User className="text-blue-600 dark:text-blue-300" size={20} />
            Información del Director
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nombre Completo</label>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">{directorNombreCompleto || 'No registrado'}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">DNI</label>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <BadgeInfo size={14} />
              {colegio.directorDni || 'No registrado'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Correo Electrónico</label>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <Mail size={14} />
              {colegio.directorEmail || 'No registrado'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Celular</label>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <Phone size={14} />
              {colegio.directorCelular || 'No registrado'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectorInfoModal;