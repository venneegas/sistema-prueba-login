import React from 'react';
import { AlertTriangle, Lock } from 'lucide-react';

const CerrarTrimestreModal = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Cerrar Trimestre</h3>
          <p className="text-gray-500 text-sm">
            ¿Está seguro? Recuerde que no podrá hacer cambios después de cerrar este trimestre.
          </p>
        </div>

        <div className="flex border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-100 disabled:cursor-not-allowed disabled:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-4 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:bg-red-50"
          >
            <Lock size={18} />
            {loading ? 'Cerrando...' : 'Sí, cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CerrarTrimestreModal;
