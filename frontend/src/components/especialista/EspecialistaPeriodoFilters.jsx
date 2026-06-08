import React from 'react';
import { Calendar } from 'lucide-react';

const getCurrentQuarter = () => String(Math.floor(new Date().getMonth() / 3) + 1);

const quarterOptions = [
  { value: '1', label: '1º Trimestre (Ene - Mar)' },
  { value: '2', label: '2º Trimestre (Abr - Jun)' },
  { value: '3', label: '3º Trimestre (Jul - Sep)' },
  { value: '4', label: '4º Trimestre (Oct - Dic)' }
];

const EspecialistaPeriodoFilters = ({
  anioActual,
  aniosDisponibles,
  trimestreSeleccionado,
  onAnioChange,
  onTrimestreChange
}) => {
  const currentYear = new Date().getFullYear();
  const currentQuarter = Number(getCurrentQuarter());
  const maxQuarterForYear = anioActual < currentYear
    ? 4
    : anioActual === currentYear
      ? currentQuarter
      : 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 bg-blue-50 dark:bg-slate-700 px-3 py-2 rounded-xl border border-blue-200 dark:border-slate-600 shadow-sm">
        <Calendar size={18} className="text-blue-500" />
        <select
          className="bg-transparent text-sm font-bold text-blue-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          value={anioActual}
          onChange={(e) => onAnioChange(Number(e.target.value))}
        >
          {aniosDisponibles.map((anio) => (
            <option key={anio} value={anio} disabled={anio > currentYear} className="bg-white dark:bg-slate-900 text-black dark:text-white">
              {anio}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 bg-blue-50 dark:bg-slate-700 px-3 py-2 rounded-xl border border-blue-200 dark:border-slate-600 shadow-sm">
        <Calendar size={18} className="text-blue-500" />
        <select
          className="bg-transparent text-sm font-bold text-blue-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          value={trimestreSeleccionado}
          onChange={(e) => onTrimestreChange(e.target.value)}
        >
          {quarterOptions.map((quarter) => (
            <option
              key={quarter.value}
              value={quarter.value}
              disabled={Number(quarter.value) > maxQuarterForYear}
              className="bg-white dark:bg-slate-900 text-black dark:text-white"
            >
              {quarter.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default EspecialistaPeriodoFilters;
