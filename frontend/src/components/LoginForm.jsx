import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { buildApiUrl } from '../config/api';
import ForgotPassword from './ForgotPassword';

const LoginForm = ({ onLoginSuccess }) => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // Nuevo estado para animación de éxito
  const [showForgotPassword, setShowForgotPassword] = useState(false); // Controla qué pantalla ver

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          correo: correo.trim(),
          password: password 
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Guardar el token (JWT) y los datos del usuario para persistir la sesión al pulsar F5
        if (data.token) localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Mostrar estado de éxito en el botón antes de redirigir
        setIsSuccess(true);
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1200); 
      } else {
        setError(data.message || 'Error en la autenticación');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setError('Error conectando con el servidor');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
        
      {/* Lado Izquierdo - Decorativo Institucional (Oculto en móviles) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden items-center justify-center p-12">
        {/* Círculos abstractos de fondo para darle modernidad */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-3/4 h-3/4 rounded-full bg-indigo-500 opacity-20 blur-3xl"></div>
        </div>
        
        <div className="relative z-10 text-white max-w-lg">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 inline-block mb-8 shadow-2xl">
            <img 
              src="https://ugelsanta.gob.pe/wp-content/uploads/2026/02/Logo_US3.png" 
              alt="Logo UGEL" 
              className="h-16 w-auto object-contain drop-shadow-md" 
              onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Logo+UGEL' }}
            />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-5 leading-tight tracking-tight">
            Gestión de Recursos <br/>
            <span className="text-blue-300">Propios</span>
          </h1>
          <p className="text-blue-100/90 text-lg leading-relaxed font-medium">
            Plataforma oficial para la declaración de ingresos y egresos de las Instituciones Educativas de la jurisdicción.
          </p>
          
          <div className="mt-16 flex items-center gap-4 text-xs text-blue-200/60 font-semibold uppercase tracking-widest">
            <div className="h-px bg-blue-200/20 flex-1"></div>
            UGEL Santa © 2026
            <div className="h-px bg-blue-200/20 flex-1"></div>
          </div>
        </div>
      </div>

      {/* Lado Derecho - Formulario Minimalista */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {showForgotPassword ? (
          <ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />
        ) : (
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl border border-slate-200 relative">
          
          {/* Mostrar logo en móvil (ya que el lado izquierdo se oculta) */}
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <img 
                src="https://ugelsanta.gob.pe/wp-content/uploads/2026/02/Logo_US3.png" 
                alt="Logo UGEL" 
                className="h-14 w-auto object-contain" 
              />
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">¡Bienvenido!</h2>
            <p className="text-slate-500 font-medium">Ingresa tus credenciales para continuar</p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo Correo */}
            <div className="space-y-2 text-left">
              <label className="text-sm font-bold text-slate-700 block">Correo Electrónico</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="email"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                  placeholder="director@correo.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  disabled={loading}
                />
            </div>
          </div>

          {/* Campo Contraseña */}
            <div className="space-y-2 text-left relative">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700 block">Contraseña</label>
                <button 
                  type="button" 
                  onClick={() => setShowForgotPassword(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-bold hover:underline transition-colors" 
                  tabIndex="-1"
                >
                  ¿Olvidaste tu clave?
                </button>
            </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3.5 pl-11 pr-12 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
          </div>

            {/* Alerta de Error Elegante */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl animate-in fade-in slide-in-from-top-2">
                <p className="text-red-700 text-sm font-bold">{error}</p>
              </div>
            )}

            {/* Botón Mágico Inteligente */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 relative overflow-hidden ${
                isSuccess 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/25 scale-[0.98]' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] disabled:from-slate-400 disabled:to-slate-500 disabled:transform-none disabled:shadow-none'
              }`}
            >
              {isSuccess ? (
                <>
                  <CheckCircle size={22} className="animate-in zoom-in" />
                  <span>¡Acceso Correcto!</span>
                </>
              ) : loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
              Acceso exclusivo para personal autorizado.
            </p>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
