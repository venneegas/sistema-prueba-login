export const ROLE_PATHS = {
  director: {
    base: '/director',
    defaultView: 'general',
    views: ['general', 'ingresos', 'egresos', 'facturas', 'estado-reporte', 'informacion', 'tesoreria'],
  },
  admin: {
    base: '/admin',
    defaultView: 'control',
    views: ['control', 'database', 'usuarios', 'auditoria', 'sesiones', 'flujos', 'seguridad', 'configuracion'],
  },
  especialista: {
    base: '/especialista',
    defaultView: 'explorador',
    views: ['explorador', 'estadisticas', 'alertas', 'dataset-ml', 'reportes', 'solicitudes', 'configuracion'],
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

export const buildRolePath = (role, view) => {
  const config = ROLE_PATHS[role];
  if (!config) return '/';

  const nextView = config.views.includes(view) ? view : config.defaultView;
  return `${config.base}/${nextView}`;
};

export const syncRolePath = (role, view, { replace = false } = {}) => {
  const nextPath = buildRolePath(role, view);
  if (cleanPath() === nextPath) return;

  const method = replace ? 'replaceState' : 'pushState';
  window.history[method](
    {
      ...(window.history.state || {}),
      role,
      view,
    },
    '',
    nextPath
  );
};
