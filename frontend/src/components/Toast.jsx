import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => { if (onClose) onClose(); }, 300); // Esperar a la animación de desvanecimiento
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const bgColor = type === 'success'
    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30'
    : 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30';
  const textColor = type === 'success' ? 'text-emerald-800 dark:text-emerald-100' : 'text-red-800 dark:text-red-100';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;
  const iconColor = type === 'success' ? 'text-emerald-500' : 'text-red-500';

  return createPortal((
    <div className={`fixed bottom-6 right-6 z-[600] flex items-center gap-3 rounded-xl border px-5 py-4 shadow-2xl transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${bgColor} ${textColor}`}>
      <Icon className={`w-6 h-6 ${iconColor}`} />
      <p className="text-sm font-bold">{message}</p>
      <button 
        onClick={() => { setIsVisible(false); setTimeout(() => { if (onClose) onClose(); }, 300); }} 
        className="ml-4 text-gray-400 transition-colors hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  ), document.body);
};

export default Toast;
