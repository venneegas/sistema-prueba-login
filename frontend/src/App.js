import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import DirectorDashboard from './components/director/DirectorDashboard';
import EspecialistaDashboard from './components/especialista/EspecialistaDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import WelcomeSplash from './components/WelcomeSplash';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(false);

  useEffect(() => {
    // Recuperar sesión persistente si el usuario da F5
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowWelcomeSplash(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowWelcomeSplash(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-blue-600">Cargando Sistema...</div>;
  }

  // 1. Si no hay usuario logueado, mostrar pantalla de Login
  if (!user) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. ENRUTADOR POR ROLES: Si es Especialista
  if (user.rol === 'especialista') {
    return (
      <>
        <EspecialistaDashboard user={user} onLogout={handleLogout} />
        {showWelcomeSplash && <WelcomeSplash user={user} onDone={() => setShowWelcomeSplash(false)} />}
      </>
    );
  }

  // 3. ENRUTADOR POR ROLES: Si es Administrador del Sistema
  if (user.rol === 'admin') {
    return (
      <>
        <AdminDashboard user={user} onLogout={handleLogout} />
        {showWelcomeSplash && <WelcomeSplash user={user} onDone={() => setShowWelcomeSplash(false)} />}
      </>
    );
  }

  // 4. ENRUTADOR POR ROLES: Si es Director
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

  // 5. FALLBACK DE SEGURIDAD (Rol desconocido)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
      <p className="text-slate-600 mb-4">Rol de usuario desconocido o corrupto.</p>
      <button onClick={handleLogout} className="bg-slate-800 text-white px-4 py-2 rounded-lg">Volver al Login</button>
    </div>
  );
}

export default App;
