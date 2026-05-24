import React, { useEffect, useMemo, useState } from 'react';

const getDisplayName = (user) => {
  const directorName = [
    user?.director?.nombres,
    user?.director?.apellido_paterno,
  ].filter(Boolean).join(' ').trim();

  const fallbackName = [
    user?.nombre,
    user?.apellido,
  ].filter(Boolean).join(' ').trim();

  return directorName || fallbackName || user?.email || 'Usuario';
};

const getSubtitle = (role) => {
  switch (role) {
    case 'director':
      return 'Preparando tu panel de Director';
    case 'especialista':
      return 'Preparando tu panel de Especialista';
    case 'admin':
      return 'Preparando el panel administrativo';
    default:
      return 'Preparando tu espacio de trabajo';
  }
};

const WelcomeSplash = ({ user, onDone }) => {
  const [isLeaving, setIsLeaving] = useState(false);

  const displayName = useMemo(() => getDisplayName(user), [user]);
  const subtitle = useMemo(() => getSubtitle(user?.rol), [user?.rol]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const leaveDelay = prefersReducedMotion ? 450 : 1350;
    const doneDelay = prefersReducedMotion ? 700 : 1850;

    const leaveTimer = setTimeout(() => setIsLeaving(true), leaveDelay);
    const doneTimer = setTimeout(() => onDone?.(), doneDelay);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`welcome-splash fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 px-6 text-white ${
        isLeaving ? 'welcome-splash--leaving' : ''
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -left-24 top-[-10%] h-80 w-80 rounded-full bg-sky-300 blur-3xl" />
        <div className="absolute bottom-[-12%] right-[-8%] h-96 w-96 rounded-full bg-indigo-400 blur-3xl" />
      </div>

      <div className="welcome-splash__content relative z-10 text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-blue-100/80">
          Sistema UGEL Santa
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
          Bienvenido, {displayName}
        </h1>
        <p className="mt-4 text-base font-semibold text-blue-100 sm:text-lg">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

export default WelcomeSplash;
