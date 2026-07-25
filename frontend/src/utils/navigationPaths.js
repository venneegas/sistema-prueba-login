export const ROLE_PATHS = {
  director: {
    base: '/director',
    defaultView: 'general',
    views: ['general', 'ingresos', 'egresos', 'facturas', 'estado-reporte', 'informacion', 'tesoreria'],
    modals: ['credenciales', 'solicitud'],
  },
  admin: {
    base: '/admin',
    defaultView: 'control',
    views: ['control', 'database', 'usuarios', 'auditoria', 'sesiones', 'flujos', 'seguridad', 'configuracion'],
    modals: [],
  },
  especialista: {
    base: '/especialista',
    defaultView: 'explorador',
    views: ['explorador', 'estadisticas', 'alertas', 'dataset-ml', 'reportes', 'solicitudes', 'configuracion'],
    modals: ['credenciales'],
  },
};

const cleanPath = (path = window.location.pathname) => path.replace(/\/+$/, '') || '/';

export const getViewFromPath = (role, path = window.location.pathname) => {
  const config = ROLE_PATHS[role];
  if (!config) return null;

  const normalizedPath = cleanPath(path);
  if (normalizedPath === config.base) return config.defaultView;

  const prefix = `${config.base}/`;
  if (!normalizedPath.startsWith(prefix)) return null;

  const view = normalizedPath.slice(prefix.length).split('/')[0];
  return config.views.includes(view) ? view : config.defaultView;
};

export const getModalFromPath = (role, path = window.location.pathname) => {
  const config = ROLE_PATHS[role];
  if (!config) return null;

  const normalizedPath = cleanPath(path);
  const prefix = `${config.base}/`;
  if (!normalizedPath.startsWith(prefix)) return null;

  const [, modal] = normalizedPath.slice(prefix.length).split('/');
  return config.modals.includes(modal) ? modal : null;
};

export const buildRolePath = (role, view, modal = null) => {
  const config = ROLE_PATHS[role];
  if (!config) return '/';

  const nextView = config.views.includes(view) ? view : config.defaultView;
  const nextModal = config.modals.includes(modal) ? `/${modal}` : '';
  return `${config.base}/${nextView}${nextModal}`;
};

export const syncRolePath = (role, view, { modal = null, replace = false } = {}) => {
  const nextPath = buildRolePath(role, view, modal);
  if (cleanPath() === nextPath) return;

  const method = replace ? 'replaceState' : 'pushState';
  window.history[method](
    {
      ...(window.history.state || {}),
      role,
      view,
      modal,
    },
    '',
    nextPath
  );
};
