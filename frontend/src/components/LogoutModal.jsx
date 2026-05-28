import React from 'react';
import { LogOut, AlertTriangle } from 'lucide-react';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">¿Cerrar Sesión?</h3>
          <p className="text-gray-500 text-sm">
            Asegúrate de haber guardado tus cambios antes de salir del sistema.
          </p>
        </div>
        
        <div className="flex border-t border-gray-100">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-100"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-4 py-4 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Sí, salir
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
