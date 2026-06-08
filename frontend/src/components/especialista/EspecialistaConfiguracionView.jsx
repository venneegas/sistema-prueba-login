import React from 'react';
import {
  BellRing,
  CheckCircle2,
  KeyRound,
  Mail,
  MapPin,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound
} from 'lucide-react';
import EspecialistaPageHeader from './EspecialistaPageHeader';

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'EU';
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
};

const EspecialistaConfiguracionView = ({ user, onOpenChangePassword }) => {
  const nombre = user?.nombre || 'Especialista UGEL';
  const email = user?.email || 'especialista@ugel.edu.pe';
  const iniciales = getInitials(nombre);

  return (
    <>
      <EspecialistaPageHeader
        icon={Settings}
        title="Configuracion de Cuenta"
        subtitle="Gestiona tu perfil, seguridad y preferencias del panel de especialista."
        actions={(
          <div className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
            <ShieldCheck size={18} />
            Cuenta activa
          </div>
        )}
      />

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/70 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto space-y-6">
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-500/20">
                  {iniciales}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">{nombre}</h2>
                    <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                      Especialista
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Especialista de Contabilidad
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:min-w-72">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Rol del sistema</p>
                  <p className="mt-1 font-bold text-slate-800 dark:text-slate-100">Auditor / Especialista</p>
                </div>
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Estado</p>
                  <p className="mt-1 inline-flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 size={16} />
                    Activo
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-900/40">
                <UserRound className="text-blue-600 dark:text-blue-400" size={20} />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Información del Perfil</h2>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nombre completo</label>
                  <div className="min-h-12 flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 text-sm font-bold text-slate-800 dark:text-slate-100">
                    {nombre}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Correo electrónico</label>
                  <div className="min-h-12 flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 text-sm font-bold text-slate-800 dark:text-slate-100">
                    <Mail size={16} className="text-slate-400" />
                    <span className="truncate">{email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Sede asignada</label>
                  <div className="min-h-12 flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 text-sm font-bold text-slate-800 dark:text-slate-100">
                    <MapPin size={16} className="text-slate-400" />
                    UGEL Sede
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Permisos</label>
                  <div className="min-h-12 flex items-center rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-4 text-sm font-bold text-blue-700 dark:text-blue-300">
                    Supervisión y auditoría
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-900/40">
                <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={20} />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Seguridad</h2>
              </div>

              <div className="p-6 space-y-5">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contraseña</p>
                  <p className="mt-2 font-bold text-slate-800 dark:text-slate-100">Acceso protegido</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Actualízala periódicamente para mantener segura la revisión de reportes.
                  </p>
                </div>

                <button
                  onClick={onOpenChangePassword}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-sm"
                >
                  <KeyRound size={18} />
                  Cambiar contraseña
                </button>
              </div>
            </section>
          </div>

          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-900/40">
              <Sparkles className="text-blue-600 dark:text-blue-400" size={20} />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Preferencias de Interfaz</h2>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                    <BellRing size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">Notificaciones por correo</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Avisos cuando un director envíe reportes o solicitudes.</p>
                  </div>
                </div>

                <span className="inline-flex w-fit items-center rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                  Próximamente
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default EspecialistaConfiguracionView;

