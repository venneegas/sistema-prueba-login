import React from 'react';

const EspecialistaPageHeader = ({
  icon: Icon,
  title,
  subtitle,
  eyebrow = 'Panel de Especialista',
  actions
}) => (
  <header className="relative z-[120] mx-8 mt-8 mb-0 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.8)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/95 lg:flex-row lg:items-center lg:justify-between">
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">
        {eyebrow}
      </p>
      <h1 className="mt-1 flex items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
        {Icon && <Icon className="shrink-0 text-blue-600 dark:text-blue-300" size={26} />}
        <span className="truncate">{title}</span>
      </h1>
      {subtitle && (
        <p className="mt-1 max-w-3xl text-sm font-medium text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>

    {actions && (
      <div className="flex flex-wrap items-center gap-3">
        {actions}
      </div>
    )}
  </header>
);

export default EspecialistaPageHeader;
