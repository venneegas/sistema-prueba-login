import React from 'react';

const AdminPageHeader = ({
  icon: Icon,
  title,
  subtitle,
  eyebrow = 'Panel administrativo',
  actions
}) => (
  <header className="shrink-0 border-b border-slate-200 bg-white/95 px-8 py-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        {Icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-950 text-amber-300 shadow-sm ring-1 ring-blue-900/20 dark:bg-blue-900">
            <Icon size={24} />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
            {eyebrow}
          </p>
          <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          {actions}
        </div>
      )}
    </div>
  </header>
);

export default AdminPageHeader;
