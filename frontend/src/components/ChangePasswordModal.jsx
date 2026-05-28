import React, { useEffect, useState } from 'react';
import { X, Lock, Eye, EyeOff, Key, ShieldCheck } from 'lucide-react';
import { buildApiUrl } from '../config/api';

const ChangePasswordModal = ({
  isOpen,
  onClose,
  mode = 'optional',
  onPasswordChanged,
}) => {
  const esCambioObligatorio = mode === 'required';
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if ((!esCambioObligatorio && !currentPassword) || !newPassword || !confirmPassword) {
      setError('Todos los campos son requeridos.');
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!esCambioObligatorio && currentPassword === newPassword) {
      setError('La nueva contraseña no puede ser igual a la actual.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(buildApiUrl('/api/auth/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...(esCambioObligatorio ? { isFirstLoginChange: true } : { currentPassword }),
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Error al cambiar la contraseña.');
        return;
      }

      const updatedUser = (() => {
        try {
          const rawUser = localStorage.getItem('user');
          if (!rawUser) return null;

          const parsedUser = JSON.parse(rawUser);
          const nextUser = { ...parsedUser, debeCambiarPassword: false };
          localStorage.setItem('user', JSON.stringify(nextUser));
          return nextUser;
        } catch (storageError) {
          console.error('No se pudo actualizar el usuario en localStorage:', storageError);
          return null;
        }
      })();

      setSuccess(
        esCambioObligatorio
          ? 'Contraseña actualizada. Ya puedes continuar al sistema.'
          : 'Contraseña actualizada correctamente.'
      );

      setTimeout(() => {
        onPasswordChanged?.(updatedUser);
        onClose();
      }, 1200);
    } catch (requestError) {
      console.error('Error:', requestError);
      setError('Error conectando con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[500]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Cabecera Moderna */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute -right-4 -top-4 text-blue-500/10">
            <ShieldCheck size={100} />
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner border border-blue-200">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                {esCambioObligatorio ? 'Cambio Obligatorio' : 'Cambiar Contraseña'}
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                {esCambioObligatorio
                  ? 'Actualiza tu clave para ingresar.'
                  : 'Protege el acceso a tu cuenta.'}
              </p>
            </div>
          </div>
          {!esCambioObligatorio && (
            <button
              onClick={onClose}
            className="relative z-10 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 p-2 rounded-xl transition-colors"
            >
            <X size={20} />
            </button>
          )}
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 px-4 py-3 rounded-r-xl text-sm font-medium animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 px-4 py-3 rounded-r-xl text-sm font-medium animate-in slide-in-from-top-2">
              {success}
            </div>
          )}

          {!esCambioObligatorio && (
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">
                Contraseña Actual
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Key size={18} />
                </div>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 pl-10 pr-12 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">
              Nueva Contraseña
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Key size={18} />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 pl-10 pr-12 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Key size={18} />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 pl-10 pr-12 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                placeholder="Repite la nueva contraseña"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
            {!esCambioObligatorio && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-blue-500/25 hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Actualizar Clave</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
