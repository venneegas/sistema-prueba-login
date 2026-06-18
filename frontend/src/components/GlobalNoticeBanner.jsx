import React from 'react';
import { Megaphone } from 'lucide-react';

const GlobalNoticeBanner = ({ avisos = [] }) => {
  if (!avisos.length) return null;

  return (
    <div className="mb-5 space-y-3">
      {avisos.map((aviso) => (
        <div key={aviso.id} className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
              <Megaphone size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-amber-950 dark:text-amber-100">{aviso.titulo}</p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-amber-900 dark:text-amber-50">{aviso.mensaje}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GlobalNoticeBanner;
