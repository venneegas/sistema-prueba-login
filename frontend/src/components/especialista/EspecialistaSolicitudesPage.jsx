import React from 'react';
import EspecialistaSolicitudesView from './EspecialistaSolicitudesView';
import { ShieldCheck } from 'lucide-react';

const EspecialistaSolicitudesPage = () => {
  return (
    <>
      <header className="bg-white dark:bg-slate-800 shadow-sm px-8 py-5 flex items-center justify-between z-10 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          <ShieldCheck className="text-blue-600" size={28} />
          Solicitudes de Credenciales
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-900">
        <EspecialistaSolicitudesView />
      </div>
    </>
  );
};

export default EspecialistaSolicitudesPage;
