import React from 'react';
import { Calendar } from 'lucide-react';

const EspecialistaPeriodoFilters = ({
  anioActual,
  aniosDisponibles,
  trimestreSeleccionado,
  onAnioChange,
  onTrimestreChange
}) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <Calendar size={18} className="text-blue-500" />
        <select
          className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          value={anioActual}
          onChange={(e) => onAnioChange(Number(e.target.value))}
        >
          {aniosDisponibles.map((anio) => (
            <option key={anio} value={anio} className="bg-white dark:bg-slate-900 text-black dark:text-white">
              {anio}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <Calendar size={18} className="text-blue-500" />
        <select
          className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          value={trimestreSeleccionado}
          onChange={(e) => onTrimestreChange(e.target.value)}
        >
          <option value="1" className="bg-white dark:bg-slate-900 text-black dark:text-white">1er Trimestre (Ene - Mar)</option>
          <option value="2" className="bg-white dark:bg-slate-900 text-black dark:text-white">2do Trimestre (Abr - Jun)</option>
          <option value="3" className="bg-white dark:bg-slate-900 text-black dark:text-white">3er Trimestre (Jul - Sep)</option>
          <option value="4" className="bg-white dark:bg-slate-900 text-black dark:text-white">4to Trimestre (Oct - Dic)</option>
        </select>
      </div>
    </div>
  );
};

export default EspecialistaPeriodoFilters;
