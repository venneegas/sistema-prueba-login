import React from 'react';
import EspecialistaSolicitudesView from './EspecialistaSolicitudesView';

const EspecialistaSolicitudesPage = () => {
  return (
    <>
      <header className="bg-white shadow-sm px-8 py-5 flex items-center justify-between z-10 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800">Solicitudes de Credenciales</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
        <EspecialistaSolicitudesView />
      </div>
    </>
  );
};

export default EspecialistaSolicitudesPage;
