const normalizeOptionalString = (value) => {
  if (value === undefined || value === null) return undefined;
  return String(value).trim();
};

const validateDirectorProfileUpdate = (payload = {}) => {
  const sanitized = {};

  const dni = normalizeOptionalString(payload.dni);
  if (dni !== undefined) {
    if (!/^\d{8}$/.test(dni)) {
      throw new Error('El DNI debe contener exactamente 8 dígitos numéricos.');
    }
    sanitized.dni = dni;
  }

  const celular = normalizeOptionalString(payload.celular);
  if (celular !== undefined) {
    if (!/^\d{9}$/.test(celular)) {
      throw new Error('El celular debe contener exactamente 9 dígitos numéricos.');
    }
    sanitized.celular = celular;
  }

  const email = normalizeOptionalString(payload.email);
  if (email !== undefined) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('El correo debe tener un formato válido.');
    }
    sanitized.email = email;
  }

  const ruc = normalizeOptionalString(payload.ruc);
  if (ruc !== undefined) {
    if (ruc === '') {
      sanitized.ruc = null;
    } else if (!/^\d{11}$/.test(ruc)) {
      throw new Error('El RUC debe contener exactamente 11 dígitos numéricos.');
    } else {
      sanitized.ruc = ruc;
    }
  }

  return sanitized;
};

module.exports = {
  validateDirectorProfileUpdate,
};
