import React, { useState } from 'react';
import { buildApiUrl } from '../config/api';

const ForgotPassword = ({ onBackToLogin }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Estados del formulario
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Paso 1: Solicitar código al backend
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const res = await fetch(buildApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Código enviado. Revisa tu bandeja de entrada.' });
        setStep(2); // Avanzamos al paso 2
      } else {
        setMessage({ type: 'error', text: data.message || 'Error al enviar el código.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión con el servidor.' });
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Validar código y cambiar contraseña
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo, nuevaPassword: newPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: '¡Contraseña actualizada exitosamente! Redirigiendo...' });
        // Esperar 3 segundos para que el usuario lea el mensaje y devolverlo al login
        setTimeout(() => {
          onBackToLogin();
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Código incorrecto o expirado.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión con el servidor.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl border border-slate-200 relative animate-in fade-in zoom-in duration-300">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Recuperar Contraseña
      </h2>

      {/* Mostrar mensajes de error o éxito */}
      {message.text && (
        <div className={`p-3 mb-4 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {step === 1 ? (
        // FORMULARIO PASO 1
        <form onSubmit={handleRequestCode} className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Ingresa tu correo electrónico registrado y te enviaremos un código de seguridad de 6 dígitos.
          </p>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ejemplo@ugel.edu.pe"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar Código'}
          </button>
        </form>
      ) : (
        // FORMULARIO PASO 2
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="text-center mb-4 bg-slate-50 py-2 rounded border border-slate-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Restableciendo acceso para</p>
            <p className="font-semibold text-blue-700">{email}</p>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Código de 6 dígitos</label>
            <input
              type="text"
              required
              maxLength="6"
              inputMode="numeric"
              pattern="[0-9]*"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center text-lg"
              placeholder="123456"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Nueva Contraseña</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Confirmar Contraseña</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Repite la nueva contraseña"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || message.type === 'success'} 
            className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
          >
            {loading ? 'Guardando...' : 'Guardar y Entrar'}
          </button>
        </form>
      )}

      <div className="mt-4 text-center">
        <button type="button" onClick={onBackToLogin} className="text-sm text-blue-600 hover:underline">
          &larr; Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;