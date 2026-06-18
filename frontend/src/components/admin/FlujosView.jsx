import React from 'react';
import { Network, Server, Eye, GraduationCap, ArrowDown, ShieldCheck, FileCheck, UploadCloud, Users, Database } from 'lucide-react';
import AdminPageHeader from './AdminPageHeader';

const FlujosView = () => {
  return (
    <>
      <AdminPageHeader
        icon={Network}
        title="Flujos del Sistema"
        subtitle="Visualiza el recorrido operativo entre administrador, especialista y director."
      />

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
        <div className="max-w-4xl mx-auto relative pt-4 pb-10">
          {/* Línea conectora central (solo visible en escritorio) */}
          <div className="absolute left-1/2 top-10 bottom-10 w-1 bg-blue-200 -translate-x-1/2 z-0 hidden md:block"></div>

          {/* Nivel 1: Admin */}
          <div className="relative z-10 flex flex-col md:flex-row items-center mb-12">
            <div className="md:w-1/2 md:pr-12 text-right hidden md:block">
              <h3 className="text-xl font-bold text-slate-800">Administrador de TI</h3>
              <p className="text-slate-500 text-sm mt-1 font-medium">Nivel Superior / Soporte Técnico</p>
            </div>
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg z-10 shrink-0">
              <Server size={28} className="text-white" />
            </div>
            <div className="md:w-1/2 md:pl-12 w-full mt-6 md:mt-0">
              <div className="md:hidden text-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">Administrador de TI</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-700 mt-0.5"><Users size={18} /></div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">Gestión de Usuarios</p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">Crea, edita y suspende accesos para Especialistas y Directores de la UGEL.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-700 mt-0.5"><Database size={18} /></div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">Auditoría y Backups</p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">Monitorea todas las acciones (logs) del sistema y descarga respaldos de la base de datos.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Flecha Mobile */}
          <div className="flex justify-center mb-12 md:hidden text-blue-300">
            <ArrowDown size={32} />
          </div>

          {/* Nivel 2: Especialista */}
          <div className="relative z-10 flex flex-col md:flex-row-reverse items-center mb-12">
            <div className="md:w-1/2 md:pl-12 text-left hidden md:block">
              <h3 className="text-xl font-bold text-slate-800">Especialista UGEL</h3>
              <p className="text-slate-500 text-sm mt-1 font-medium">Nivel Intermedio / Auditor Financiero</p>
            </div>
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg z-10 shrink-0">
              <Eye size={28} className="text-white" />
            </div>
            <div className="md:w-1/2 md:pr-12 w-full mt-6 md:mt-0 text-left">
              <div className="md:hidden text-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">Especialista UGEL</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-700 mt-0.5"><ShieldCheck size={18} /></div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">Revisión de Declaraciones</p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">Supervisa que los ingresos, egresos y saldos bancarios de los colegios cuadren perfectamente.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-700 mt-0.5"><FileCheck size={18} /></div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">Aprobación / Observación</p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">Acepta el cierre definitivo del trimestre o devuelve el reporte con observaciones al Director.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Flecha Mobile */}
          <div className="flex justify-center mb-12 md:hidden text-blue-300">
            <ArrowDown size={32} />
          </div>

          {/* Nivel 3: Director */}
          <div className="relative z-10 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12 text-right hidden md:block">
              <h3 className="text-xl font-bold text-slate-800">Director de I.E.</h3>
              <p className="text-slate-500 text-sm mt-1 font-medium">Nivel Operativo / Declarante</p>
            </div>
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg z-10 shrink-0">
              <GraduationCap size={28} className="text-white" />
            </div>
            <div className="md:w-1/2 md:pl-12 w-full mt-6 md:mt-0">
              <div className="md:hidden text-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">Director de I.E.</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700 mt-0.5"><UploadCloud size={18} /></div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">Registro y Sustentos PDF</p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">Ingresa los movimientos contables mes a mes y sube los comprobantes en formato PDF.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700 mt-0.5"><ShieldCheck size={18} /></div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">Cierre Trimestral</p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">Sella la información y la envía bloqueada al Especialista para iniciar el ciclo de auditoría.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default FlujosView;
