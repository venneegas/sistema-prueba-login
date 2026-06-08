import React from 'react';
import EspecialistaSolicitudesView from './EspecialistaSolicitudesView';
import { ShieldCheck } from 'lucide-react';
import EspecialistaPageHeader from './EspecialistaPageHeader';

const EspecialistaSolicitudesPage = () => {
  return (
    <>
      <EspecialistaPageHeader
        icon={ShieldCheck}
        title="Solicitudes de Credenciales"
        subtitle="Revisa, aprueba o rechaza solicitudes de reemplazo de responsables."
      />

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-900">
        <EspecialistaSolicitudesView />
      </div>
    </>
  );
};

export default EspecialistaSolicitudesPage;
