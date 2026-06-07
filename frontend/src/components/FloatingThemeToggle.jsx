import React from 'react';
import { Moon, Sun } from 'lucide-react';

const FloatingThemeToggle = ({ isDarkMode, onToggle, className = '' }) => {
  const Icon = isDarkMode ? Sun : Moon;
  const title = isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={title}
      title={title}
      className={`fixed bottom-6 right-6 z-[80] flex h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-white/95 text-slate-700 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.75)] backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/95 dark:text-amber-300 dark:hover:bg-slate-700 ${className}`}
    >
      <Icon size={21} strokeWidth={2.4} />
    </button>
  );
};

export default FloatingThemeToggle;
