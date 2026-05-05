import React from 'react';
import { BellRing, Key, Mail, Moon, Settings, Shield } from 'lucide-react';

const EspecialistaConfiguracionView = ({ user, onOpenChangePassword }) => {
  return (
    <>
      <header className="bg-white shadow-sm px-8 py-5 flex items-center justify-between z-10 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Settings className="text-blue-600" size={28} />
          Configuracion de Cuenta
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <Mail className="text-slate-400" size={20} />
              <h2 className="text-lg font-bold text-slate-800">Perfil Personal</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1">Nombre Completo</label>
                <p className="text-slate-800 font-medium bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                  {user?.nombre || 'Especialista UGEL'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1">Correo Electronico</label>
                <p className="text-slate-800 font-medium bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                  <Mail size={16} className="text-slate-400" />
                  {user?.email || 'especialista@ugel.edu.pe'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1">Rol en el Sistema</label>
                <p className="text-blue-700 font-bold bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-200 inline-block">
                  Auditor / Especialista
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <Shield className="text-slate-400" size={20} />
              <h2 className="text-lg font-bold text-slate-800">Seguridad y Acceso</h2>
            </div>
            <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-700">Contrasena de acceso</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md">
                  Te recomendamos cambiar tu contrasena periodicamente para mantener la seguridad de las auditorias.
                </p>
              </div>
              <button
                onClick={onOpenChangePassword}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all shadow-sm"
              >
                <Key size={18} />
                Cambiar Contrasena
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <Settings className="text-slate-400" size={20} />
              <h2 className="text-lg font-bold text-slate-800">Preferencias de Interfaz</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Moon size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">Modo Oscuro</p>
                    <p className="text-xs text-slate-500">Cambia la apariencia del panel a colores oscuros.</p>
                  </div>
                </div>
                <div className="bg-slate-200 text-slate-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Proximamente
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <BellRing size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">Notificaciones por Correo</p>
                    <p className="text-xs text-slate-500">Recibir un email cuando un director envie un reporte.</p>
                  </div>
                </div>
                <div className="bg-slate-200 text-slate-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Proximamente
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EspecialistaConfiguracionView;
