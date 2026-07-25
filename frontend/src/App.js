import React, { useCallback, useEffect, useState } from 'react';
import LoginForm from './components/LoginForm';
import DirectorDashboard from './components/director/DirectorDashboard';
import EspecialistaDashboard from './components/especialista/EspecialistaDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import WelcomeSplash from './components/WelcomeSplash';
import { clearSession, getMsUntilSessionExpiration, getStoredSession } from './utils/sessionManager';

const SESSION_EXPIRED_MESSAGE = 'Tu sesión ha expirado por seguridad. Por favor, inicia sesión nuevamente.';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(false);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowWelcomeSplash(true);
  };

  const handleLogout = useCallback(() => {
    clearSession();
    setUser(null);
    setShowWelcomeSplash(false);
    window.history.replaceState({}, '', '/');
  }, []);

  useEffect(() => {
    const storedSession = getStoredSession();
    if (storedSession) {
      setUser(storedSession.user);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    const expireSession = () => {
      if (!getStoredSession()) {
        alert(SESSION_EXPIRED_MESSAGE);
        handleLogout();
      }
    };

    const timeout = setTimeout(expireSession, getMsUntilSessionExpiration());
    const handleVisibilityChange = () => {
      if (!document.hidden) expireSession();
    };
    const handleWindowFocus = () => expireSession();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [handleLogout, user]);

  useEffect(() => {
    const originalFetch = window.fetch;
    let hasNotifiedExpiration = false;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401 && localStorage.getItem('token') && !hasNotifiedExpiration) {
        hasNotifiedExpiration = true;
        alert(SESSION_EXPIRED_MESSAGE);
        handleLogout();
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [handleLogout]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-blue-600">Cargando Sistema...</div>;
  }

  if (!user) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  if (user.rol === 'especialista') {
    return (
      <>
        <EspecialistaDashboard user={user} onLogout={handleLogout} />
        {showWelcomeSplash && <WelcomeSplash user={user} onDone={() => setShowWelcomeSplash(false)} />}
      </>
    );
  }

  if (user.rol === 'admin') {
    return (
      <>
        <AdminDashboard user={user} onLogout={handleLogout} />
        {showWelcomeSplash && <WelcomeSplash user={user} onDone={() => setShowWelcomeSplash(false)} />}
      </>
    );
  }

  if (user.rol === 'director') {
    return (
      <>
        <DirectorDashboard
          user={user}
          onLogout={handleLogout}
          onUserUpdate={setUser}
        />
        {showWelcomeSplash && <WelcomeSplash user={user} onDone={() => setShowWelcomeSplash(false)} />}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
      <p className="text-slate-600 mb-4">Rol de usuario desconocido o corrupto.</p>
      <button onClick={handleLogout} className="bg-slate-800 text-white px-4 py-2 rounded-lg">Volver al Login</button>
    </div>
  );
}

export default App;
