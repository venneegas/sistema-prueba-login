export const ESTADOS_REPORTE = ['Borrador', 'Enviado', 'Observado', 'Aprobado'];

export const getEstadoReporteLabel = (estado) => {
  if (!estado) return 'Pendiente';
  return estado === 'Borrador' ? 'Pendiente' : estado;
};

export const isEstadoPendiente = (estado) => {
  const normalized = String(estado || 'Borrador').toLowerCase();
  return normalized === 'borrador' || normalized === 'pendiente';
};

export const getEstadoReporteBadgeClass = (estado) => {
  if (estado === 'Aprobado') {
    return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
  }

  if (estado === 'Observado') {
    return 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800';
  }

  if (estado === 'Enviado') {
    return 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
  }

  if (isEstadoPendiente(estado)) {
    return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  }

  return 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
};
