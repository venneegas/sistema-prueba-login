import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', isDestructive = false }) => {
  if (!isOpen) return null;

  return createPortal((
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
        <div className="p-6 text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDestructive ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300'}`}>
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
          <p className="text-slate-500 dark:text-slate-300 text-sm font-medium">
            {message}
          </p>
        </div>
        <div className="flex border-t border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-4 text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors border-r border-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${isDestructive ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10' : 'text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  ), document.body);
};

export default ConfirmModal;
