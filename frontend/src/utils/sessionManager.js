const SESSION_KEYS = {
  token: 'token',
  user: 'user',
  createdAt: 'sessionCreatedAt',
  expiresAt: 'sessionExpiresAt'
};

const DEFAULT_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

const decodeBase64Url = (value) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return atob(padded);
};

export const getJwtPayload = (token) => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload));
  } catch (error) {
    return null;
  }
};

export const getJwtExpirationMs = (token) => {
  const payload = getJwtPayload(token);
  return payload?.exp ? payload.exp * 1000 : null;
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEYS.token);
  localStorage.removeItem(SESSION_KEYS.user);
  localStorage.removeItem(SESSION_KEYS.createdAt);
  localStorage.removeItem(SESSION_KEYS.expiresAt);
};

export const saveSession = ({ token, user }) => {
  const createdAt = Date.now();
  const jwtExpiresAt = token ? getJwtExpirationMs(token) : null;
  const fallbackExpiresAt = createdAt + DEFAULT_SESSION_DURATION_MS;
  const expiresAt = jwtExpiresAt || fallbackExpiresAt;

  if (token) {
    localStorage.setItem(SESSION_KEYS.token, token);
  }
  localStorage.setItem(SESSION_KEYS.user, JSON.stringify(user));
  localStorage.setItem(SESSION_KEYS.createdAt, String(createdAt));
  localStorage.setItem(SESSION_KEYS.expiresAt, String(expiresAt));
};

export const getStoredSession = () => {
  const token = localStorage.getItem(SESSION_KEYS.token);
  const rawUser = localStorage.getItem(SESSION_KEYS.user);
  const storedExpiresAt = Number(localStorage.getItem(SESSION_KEYS.expiresAt));
  const tokenExpiresAt = token ? getJwtExpirationMs(token) : null;
  const expiresAt = tokenExpiresAt || storedExpiresAt;

  if (!token || !rawUser || !expiresAt || Date.now() >= expiresAt) {
    clearSession();
    return null;
  }

  try {
    return {
      token,
      user: JSON.parse(rawUser),
      expiresAt
    };
  } catch (error) {
    clearSession();
    return null;
  }
};

export const getMsUntilSessionExpiration = () => {
  const session = getStoredSession();
  return session ? Math.max(session.expiresAt - Date.now(), 0) : 0;
};
