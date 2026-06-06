import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock3,
  FileCheck2,
  Send,
} from 'lucide-react';

const formatearFechaCierre = (fecha) => {
  if (!fecha) return '';

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(fecha));
};

const periodos = {
  '1': { label: '1º Trimestre', meses: ['Enero', 'Febrero', 'Marzo'], fin: { dia: 31, mes: 2 } },
  '2': { label: '2º Trimestre', meses: ['Abril', 'Mayo', 'Junio'], fin: { dia: 30, mes: 5 } },
  '3': { label: '3º Trimestre', meses: ['Julio', 'Agosto', 'Septiembre'], fin: { dia: 30, mes: 8 } },
  '4': { label: '4º Trimestre', meses: ['Octubre', 'Noviembre', 'Diciembre'], fin: { dia: 31, mes: 11 } },
};

const EstadoReporteView = ({
  trimestreId,
  anio,
  trimestreCerrado,
  mensajeCierre,
  errorCierre,
  cerradoEn,
}) => {
  const periodoActual = periodos[String(trimestreId)] || periodos['1'];
  const fechaFinPeriodo = new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Number(anio), periodoActual.fin.mes, periodoActual.fin.dia));

  const estadoReporte = errorCierre
    ? {
        label: 'Estado no disponible',
        helper: 'No se pudo consultar el avance del reporte en este momento.',
        badgeClass: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200',
        iconClass: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300',
        Icon: AlertTriangle,
      }
    : trimestreCerrado
      ? {
          label: 'Enviado a revisión',
          helper: cerradoEn
            ? `Cerrado el ${formatearFechaCierre(cerradoEn)}. La UGEL puede revisar u observar el reporte.`
            : 'El reporte fue cerrado y queda pendiente de revisión por la UGEL.',
          badgeClass: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
          iconClass: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200',
          Icon: Send,
        }
      : {
          label: 'Borrador',
          helper: 'El reporte sigue editable hasta que se cierre el trimestre.',
          badgeClass: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
          iconClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
          Icon: Clock3,
        };

  const EstadoIcon = estadoReporte.Icon;

  const trazabilidadPasos = [
    {
      label: 'Registro',
      detail: 'Información económica registrada por el director.',
      status: errorCierre ? 'pending' : 'done',
    },
    {
      label: 'Cierre',
      detail: trimestreCerrado ? 'Periodo cerrado para edición.' : 'Pendiente de cierre trimestral.',
      status: errorCierre ? 'pending' : trimestreCerrado ? 'done' : 'active',
    },
    {
      label: 'Revisión UGEL',
      detail: trimestreCerrado ? 'Reporte disponible para seguimiento.' : 'Se habilita cuando el periodo sea cerrado.',
      status: errorCierre ? 'pending' : trimestreCerrado ? 'active' : 'pending',
    },
    {
      label: 'Resultado',
      detail: 'Pendiente de aprobación u observación.',
      status: 'pending',
    },
  ];

  const pasoClass = (status) => {
    if (status === 'done') return 'border-sky-600 bg-sky-600 text-white dark:border-sky-400 dark:bg-sky-500';
    if (status === 'active') return 'border-amber-400 bg-amber-100 text-amber-700 dark:border-amber-300 dark:bg-amber-500/20 dark:text-amber-200';
    return 'border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500';
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-slate-200/90 bg-white/95 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.55)] dark:border-slate-700 dark:bg-slate-800/95">
        <div className="border-b border-slate-100 bg-slate-50/80 px-7 py-6 dark:border-slate-700 dark:bg-slate-900/40">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">Estado del reporte</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Trazabilidad del consolidado trimestral</h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-300">
                Consulta el estado actual del reporte financiero y el avance de su revisión institucional.
              </p>
            </div>

            <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${estadoReporte.badgeClass}`}>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${estadoReporte.iconClass}`}>
                <EstadoIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] opacity-80">Estado actual</p>
                <p className="text-sm font-black">{estadoReporte.label}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-7 pt-6">
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-3 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300 md:flex-row md:items-center md:justify-between">
            <span>
              {periodoActual.label} {anio} · {periodoActual.meses.join(', ')}
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white">
              Fin del trimestre: {fechaFinPeriodo}
            </span>
          </div>
        </div>

        <div className="px-7 py-7">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200">
                <FileCheck2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white">Seguimiento institucional</h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Flujo referencial del reporte seleccionado.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {trazabilidadPasos.map((paso, index) => (
                <div key={paso.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${pasoClass(paso.status)}`}>
                      {paso.status === 'done' ? <CheckCircle2 className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Paso {index + 1}</p>
                      <p className="mt-1 text-sm font-extrabold text-slate-950 dark:text-white">{paso.label}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{paso.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {errorCierre || mensajeCierre || estadoReporte.helper}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EstadoReporteView;
