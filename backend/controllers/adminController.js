const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');
const { logAuditoria } = require('../utils/auditLogger');
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const escapeIdentifier = (identifier) => `\`${String(identifier).replace(/`/g, '``')}\``;

let adminTablesReadyPromise = null;
let institucionesColumnsPromise = null;

const ADMIN_MANUAL_CONCEPT_PREFIX = '[CARGA MANUAL ADMIN]';

const asegurarTablasAdmin = async () => {
  if (!adminTablesReadyPromise) {
    adminTablesReadyPromise = Promise.all([
      pool.execute(
        `CREATE TABLE IF NOT EXISTS periodo_config (
          id INT AUTO_INCREMENT PRIMARY KEY,
          anio INT NOT NULL,
          trimestre TINYINT NOT NULL,
          fecha_limite DATETIME DEFAULT NULL,
          descripcion VARCHAR(255) DEFAULT NULL,
          actualizado_por INT DEFAULT NULL,
          actualizado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uk_periodo_config (anio, trimestre),
          CONSTRAINT chk_periodo_config_trimestre CHECK (trimestre BETWEEN 1 AND 4)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      ),
      pool.execute(
        `CREATE TABLE IF NOT EXISTS especialista_instituciones (
          id INT AUTO_INCREMENT PRIMARY KEY,
          especialista_id INT NOT NULL,
          institucion_id INT NOT NULL,
          asignado_por INT DEFAULT NULL,
          asignado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uk_especialista_institucion (especialista_id, institucion_id),
          KEY idx_especialista_instituciones_especialista (especialista_id),
          KEY idx_especialista_instituciones_institucion (institucion_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      ),
      pool.execute(
        `CREATE TABLE IF NOT EXISTS periodo_prorrogas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          director_id INT NOT NULL,
          anio INT NOT NULL,
          trimestre TINYINT NOT NULL,
          fecha_limite DATETIME NOT NULL,
          motivo VARCHAR(255) DEFAULT NULL,
          creado_por INT DEFAULT NULL,
          creado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
          actualizado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uk_periodo_prorroga (director_id, anio, trimestre),
          KEY idx_periodo_prorroga_director (director_id, anio, trimestre)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      ),
      pool.execute(
        `CREATE TABLE IF NOT EXISTS admin_cierre_historial (
          id INT AUTO_INCREMENT PRIMARY KEY,
          director_id INT NOT NULL,
          anio INT NOT NULL,
          trimestre TINYINT NOT NULL,
          accion VARCHAR(20) NOT NULL,
          motivo VARCHAR(255) DEFAULT NULL,
          usuario_id INT DEFAULT NULL,
          fecha TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
          ip_address VARCHAR(45) DEFAULT NULL,
          KEY idx_cierre_historial_periodo (director_id, anio, trimestre),
          KEY idx_cierre_historial_fecha (fecha)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      ),
      pool.execute(
        `CREATE TABLE IF NOT EXISTS avisos_globales (
          id INT AUTO_INCREMENT PRIMARY KEY,
          titulo VARCHAR(150) NOT NULL,
          mensaje TEXT NOT NULL,
          rol_destino VARCHAR(30) NOT NULL DEFAULT 'todos',
          activo TINYINT(1) NOT NULL DEFAULT 1,
          visible_desde DATETIME DEFAULT NULL,
          visible_hasta DATETIME DEFAULT NULL,
          creado_por INT DEFAULT NULL,
          creado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
          KEY idx_avisos_visibilidad (activo, rol_destino, visible_desde, visible_hasta)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      )
    ]).catch((error) => {
      adminTablesReadyPromise = null;
      throw error;
    });
  }

  await adminTablesReadyPromise;
};

const quarterEndDate = (anio, trimestre) => {
  const year = Number(anio);
  switch (String(trimestre)) {
    case '1': return new Date(year, 3, 30, 23, 59, 59);
    case '2': return new Date(year, 6, 31, 23, 59, 59);
    case '3': return new Date(year, 9, 31, 23, 59, 59);
    case '4': return new Date(year + 1, 0, 31, 23, 59, 59);
    default: return new Date(year, 11, 31, 23, 59, 59);
  }
};

const toMysqlDateTime = (value) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(value))) {
    return `${value.replace('T', ' ')}:00`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const obtenerColumnasInstituciones = async () => {
  if (!institucionesColumnsPromise) {
    institucionesColumnsPromise = pool.execute('SHOW COLUMNS FROM instituciones')
      .then(([rows]) => new Set(rows.map((row) => row.Field)))
      .catch((error) => {
        institucionesColumnsPromise = null;
        throw error;
      });
  }

  return institucionesColumnsPromise;
};

const selectInstitucionColumn = (columns, column) => (
  columns.has(column) ? `i.${column}` : `NULL AS ${column}`
);

const toMoney = (value) => {
  const normalized = typeof value === 'string' ? value.replace(/,/g, '').trim() : value;
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) && numberValue >= 0 ? Number(numberValue.toFixed(2)) : null;
};

const toMonthlyMoney = (values) => {
  if (!Array.isArray(values)) return null;
  const monthly = values.slice(0, 3).map((value) => toMoney(value ?? 0));
  return monthly.length === 3 && monthly.every((value) => value !== null) ? monthly : null;
};

const getQuarterMonths = (trimestre) => {
  const start = (Number(trimestre) - 1) * 3 + 1;
  return [start, start + 1, start + 2];
};

const formatDateOnly = (date) => date.toISOString().slice(0, 10);

const getQuarterDateRange = (anio, trimestre) => {
  const year = Number(anio);
  const months = getQuarterMonths(trimestre);
  const start = new Date(Date.UTC(year, months[0] - 1, 1));
  const end = new Date(Date.UTC(year, months[2], 0));
  return {
    startDate: formatDateOnly(start),
    endDate: formatDateOnly(end),
    movementDates: months.map((month) => formatDateOnly(new Date(Date.UTC(year, month, 0))))
  };
};

const asegurarTablaCierresAdmin = async (connection = pool) => connection.execute(
  `CREATE TABLE IF NOT EXISTS cierres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    director_id INT NOT NULL,
    anio INT NOT NULL,
    trimestre TINYINT NOT NULL,
    cerrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_cierres_trimestre (director_id, anio, trimestre)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
);

const formatSqlValue = (value) => {
  if (value instanceof Date) {
    return mysql.escape(value.toISOString().slice(0, 19).replace('T', ' '));
  }

  if (Buffer.isBuffer(value)) {
    return `X'${value.toString('hex')}'`;
  }

  return mysql.escape(value);
};

const generarBackupSql = async (dbName) => {
  const [tableRows] = await pool.query('SHOW FULL TABLES WHERE Table_type = ?', ['BASE TABLE']);
  const tableNameKey = `Tables_in_${dbName}`;
  const tableNames = tableRows
    .map((row) => row[tableNameKey] || row[Object.keys(row)[0]])
    .filter(Boolean);

  const lines = [
    '-- Backup generado por el sistema UGEL Santa',
    `-- Base de datos: ${dbName}`,
    `-- Fecha: ${new Date().toISOString()}`,
    '',
    'SET FOREIGN_KEY_CHECKS=0;',
    'SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";',
    'START TRANSACTION;',
    ''
  ];

  for (const tableName of tableNames) {
    const tableIdentifier = escapeIdentifier(tableName);
    const [createRows] = await pool.query(`SHOW CREATE TABLE ${tableIdentifier}`);
    const createStatement = createRows[0]?.['Create Table'];

    lines.push('-- --------------------------------------------------------');
    lines.push(`-- Estructura de tabla para ${tableIdentifier}`);
    lines.push(`DROP TABLE IF EXISTS ${tableIdentifier};`);
    lines.push(`${createStatement};`);
    lines.push('');

    const [rows] = await pool.query(`SELECT * FROM ${tableIdentifier}`);

    if (rows.length === 0) {
      lines.push(`-- La tabla ${tableIdentifier} no contiene registros.`);
      lines.push('');
      continue;
    }

    const columns = Object.keys(rows[0]);
    const columnList = columns.map(escapeIdentifier).join(', ');

    lines.push(`-- Datos de la tabla ${tableIdentifier}`);

    for (let index = 0; index < rows.length; index += 100) {
      const chunk = rows.slice(index, index + 100);
      const values = chunk
        .map((row) => `(${columns.map((column) => formatSqlValue(row[column])).join(', ')})`)
        .join(',\n');

      lines.push(`INSERT INTO ${tableIdentifier} (${columnList}) VALUES\n${values};`);
    }

    lines.push('');
  }

  lines.push('COMMIT;');
  lines.push('SET FOREIGN_KEY_CHECKS=1;');
  lines.push('');

  return lines.join('\n');
};


const downloadBackup = async (req, res) => {
  const { DB_NAME = 'ugel_db' } = process.env;
  const date = new Date();
  const timestamp = date.toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `backup_${DB_NAME}_${timestamp}.sql`;
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const backupPath = path.join(uploadsDir, filename);

  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    const sql = await generarBackupSql(DB_NAME);
    fs.writeFileSync(backupPath, sql, 'utf8');

    res.download(backupPath, filename, async (err) => {
      if (err) {
        console.error('Error enviando el archivo al cliente:', err);
      } else {
        await logAuditoria({
          usuario_id: req.usuario?.id || 1,
          modulo: 'Administración',
          accion: 'DESCARGAR',
          descripcion: `El administrador generó y descargó un backup de la BD (${filename})`,
          ip_address: req.ip
        });
      }

      fs.unlink(backupPath, (unlinkErr) => {
        if (unlinkErr) console.error('Error eliminando temporal:', unlinkErr);
      });
    });
  } catch (error) {
    console.error('Error generando backup:', error.message);
    fs.unlink(backupPath, (unlinkErr) => {
      if (unlinkErr && unlinkErr.code !== 'ENOENT') console.error('Error eliminando temporal:', unlinkErr);
    });
    res.status(500).json({ success: false, message: 'Error interno al generar el archivo .sql' });
  }
};

const getAuditoriaLogs = async (req, res) => {
  try {
    // Traemos los últimos 100 logs cruzados con el correo del usuario
    const query = `
      SELECT a.id, a.modulo, a.accion, a.descripcion, a.fecha_hora, a.ip_address,
             u.email, r.nombre AS rol
      FROM auditorias a
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      LEFT JOIN roles r ON u.rol_id = r.id
      ORDER BY a.fecha_hora DESC
      LIMIT 100
    `;
    const [rows] = await pool.execute(query);
    
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener auditoría:', error);
    res.status(500).json({ success: false, message: 'Error al obtener los logs.' });
  }
};

const getLoginLogs = async (req, res) => {
  try {
    const query = `
      SELECT id, email, exitoso, razon_fallo, ip_address, user_agent, fecha_hora
      FROM sesiones
      ORDER BY fecha_hora DESC
      LIMIT 100
    `;
    const [rows] = await pool.execute(query);
    
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener logs de inicio de sesión:', error);
    res.status(500).json({ success: false, message: 'Error al obtener los logs de sesión.' });
  }
};

const getUsers = async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.email, r.nombre AS rol, u.estado, u.nombre as usuario_nombre,
             d.nombres, d.apellido_paterno, d.apellido_materno, i.nombre as colegio, i.numero
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN directores d ON u.director_id = d.id
      LEFT JOIN instituciones i ON d.institucion_id = i.id
      ORDER BY u.creado_en DESC
    `;
    const [rows] = await pool.execute(query);
    
    // Formatear los nombres para que se vean bien en el frontend
    const formattedRows = rows.map(row => {
      let nombre = 'Usuario Sistema';
      if (row.nombres) {
        nombre = `${row.nombres} ${row.apellido_paterno} ${row.apellido_materno || ''}`.trim();
      } else if (row.usuario_nombre) {
        nombre = row.usuario_nombre;
      } else if (row.rol === 'admin') {
        nombre = 'Administrador Principal';
      } else if (row.rol === 'especialista') {
        nombre = 'Especialista UGEL';
      }
      
      return {
        id: row.id,
        nombre,
        email: row.email,
        rol: row.rol,
        estado: row.estado,
        colegio: row.colegio || '-',
        numeroIE: row.numero || null
      };
    });

    res.status(200).json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener los usuarios.' });
  }
};

const createUser = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    // Verificar si el correo ya existe
    const [existingUser] = await pool.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'El correo electrónico ya está registrado.' });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Mapear el string 'rol' al 'rol_id' correspondiente
    const rolesMap = { director: 1, especialista: 2, admin: 3 };
    const rol_id = rolesMap[rol.toLowerCase()] || 1;

    // Insertar en la base de datos
    await pool.execute(
      'INSERT INTO usuarios (nombre, email, password_hash, rol_id, estado) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, hashedPassword, rol_id, 'activo']
    );

    try {
      await logAuditoria({
        usuario_id: req.usuario?.id || req.user?.id || 1,
        modulo: 'Administración',
        accion: 'CREAR_USER',
        descripcion: `Se creó un nuevo usuario: ${email} con el rol de ${rol}.`,
        ip_address: req.ip || req.connection?.remoteAddress
      });
    } catch (auditErr) { console.error('Error registrando auditoría:', auditErr); }

    res.status(201).json({ success: true, message: 'Usuario creado exitosamente.' });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno al crear el usuario.' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !rol) {
      return res.status(400).json({ success: false, message: 'Nombre, email y rol son requeridos.' });
    }

    // Mapear el string 'rol' al 'rol_id'
    const rolesMap = { director: 1, especialista: 2, admin: 3 };
    const rol_id = rolesMap[rol.toLowerCase()] || 1;

    let query = 'UPDATE usuarios SET nombre = ?, email = ?, rol_id = ? WHERE id = ?';
    let params = [nombre, email, rol_id, id];

    // Solo actualizamos la contraseña si el admin escribió una nueva
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres.' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      query = 'UPDATE usuarios SET nombre = ?, email = ?, rol_id = ?, password_hash = ? WHERE id = ?';
      params = [nombre, email, rol_id, hashedPassword, id];
    }

    await pool.execute(query, params);

    try {
      await logAuditoria({
        usuario_id: req.usuario?.id || req.user?.id || 1,
        modulo: 'Administración',
        accion: 'EDITAR_USER',
        descripcion: `Se actualizaron los datos del usuario ID: ${id} (${email}).`,
        ip_address: req.ip || req.connection?.remoteAddress
      });
    } catch (auditErr) { console.error('Error registrando auditoría:', auditErr); }

    res.status(200).json({ success: true, message: 'Usuario actualizado exitosamente.' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar el usuario.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Seguridad: Evitar que el administrador se elimine a sí mismo
    if (req.usuario && String(req.usuario.id) === String(id)) {
      return res.status(403).json({ success: false, message: 'Acción denegada: No puedes eliminar o suspender tu propia cuenta.' });
    }

    await pool.execute('DELETE FROM usuarios WHERE id = ?', [id]);

    try {
      await logAuditoria({
        usuario_id: req.usuario?.id || req.user?.id || 1,
        modulo: 'Administración',
        accion: 'BORRAR_USER',
        descripcion: `Se eliminó al usuario con ID: ${id}.`,
        ip_address: req.ip || req.connection?.remoteAddress
      });
    } catch (auditErr) { console.error('Error registrando auditoría:', auditErr); }

    res.status(200).json({ success: true, message: 'Usuario eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    // 1451 es el código de error de MySQL para "restricción de llave foránea"
    if (error.errno === 1451 || error.code === 'ER_ROW_IS_REFERENCED_2') {
      await pool.execute("UPDATE usuarios SET estado = IF(estado = 'activo', 'suspendido', 'activo') WHERE id = ?", [id]);
      
      try {
        await logAuditoria({
          usuario_id: req.usuario?.id || req.user?.id || 1,
          modulo: 'Administración',
          accion: 'ESTADO_USER',
          descripcion: `Se alternó el estado (suspendido/activo) del usuario con ID: ${id} debido a dependencias.`,
          ip_address: req.ip || req.connection?.remoteAddress
        });
      } catch (auditErr) { console.error('Error registrando auditoría:', auditErr); }

      return res.status(200).json({ success: true, message: 'Estado del usuario alternado entre Suspendido/Activo porque tiene registros vinculados.' });
    }
    res.status(500).json({ success: false, message: 'Error interno al procesar la solicitud.' });
  }
};

const getDashboardResumen = async (req, res) => {
  try {
    await asegurarTablasAdmin();

    const [[usuarios]] = await pool.execute(`
      SELECT
        SUM(estado = 'activo') AS activos,
        SUM(estado <> 'activo') AS inactivos,
        COUNT(*) AS total
      FROM usuarios
    `);
    const [[instituciones]] = await pool.execute('SELECT COUNT(*) AS total FROM instituciones');
    const [[cierres]] = await pool.execute('SELECT COUNT(*) AS total FROM cierres');
    const [estados] = await pool.execute(`
      SELECT estado, COUNT(*) AS total
      FROM estados
      GROUP BY estado
    `);

    res.json({
      success: true,
      data: {
        usuarios: usuarios || { activos: 0, inactivos: 0, total: 0 },
        instituciones: instituciones?.total || 0,
        cierres: cierres?.total || 0,
        estados
      }
    });
  } catch (error) {
    console.error('Error obteniendo resumen admin:', error);
    res.status(500).json({ success: false, message: 'Error al obtener el resumen administrativo.' });
  }
};

const getPeriodos = async (req, res) => {
  try {
    await asegurarTablasAdmin();

    const anioActual = Number(req.query.anio || new Date().getFullYear());
    const [rows] = await pool.execute(
      `SELECT anio, trimestre, fecha_limite, descripcion, actualizado_en
       FROM periodo_config
       WHERE anio = ?
       ORDER BY trimestre ASC`,
      [anioActual]
    );

    const byQuarter = new Map(rows.map((row) => [Number(row.trimestre), row]));
    const periodos = [1, 2, 3, 4].map((trimestre) => {
      const config = byQuarter.get(trimestre);
      const defaultLimit = quarterEndDate(anioActual, trimestre);
      const fechaLimite = config?.fecha_limite || defaultLimit;

      return {
        anio: anioActual,
        trimestre,
        fechaLimite,
        descripcion: config?.descripcion || '',
        configurado: Boolean(config),
        abierto: new Date(fechaLimite).getTime() >= Date.now()
      };
    });

    res.json({ success: true, data: periodos });
  } catch (error) {
    console.error('Error listando periodos:', error);
    res.status(500).json({ success: false, message: 'Error al listar periodos.' });
  }
};

const updatePeriodo = async (req, res) => {
  const { anio, trimestre, fechaLimite, descripcion } = req.body;

  if (!anio || !trimestre) {
    return res.status(400).json({ success: false, message: 'anio y trimestre son requeridos.' });
  }

  try {
    await asegurarTablasAdmin();

    const fechaMysql = toMysqlDateTime(fechaLimite);
    await pool.execute(
      `INSERT INTO periodo_config (anio, trimestre, fecha_limite, descripcion, actualizado_por)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        fecha_limite = VALUES(fecha_limite),
        descripcion = VALUES(descripcion),
        actualizado_por = VALUES(actualizado_por)`,
      [anio, trimestre, fechaMysql, descripcion || null, req.usuario?.id || null]
    );

    await logAuditoria({
      usuario_id: req.usuario?.id || 1,
      modulo: 'Administracion',
      accion: 'ACTUALIZAR',
      descripcion: `Actualizo el periodo ${trimestre}-${anio} con fecha limite ${fechaMysql || 'sin limite personalizada'}.`,
      ip_address: req.ip
    });

    res.json({ success: true, message: 'Periodo actualizado correctamente.' });
  } catch (error) {
    console.error('Error actualizando periodo:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el periodo.' });
  }
};

const getInstituciones = async (req, res) => {
  try {
    await asegurarTablasAdmin();
    const columns = await obtenerColumnasInstituciones();

    const [rows] = await pool.execute(`
      SELECT
        i.id,
        ${selectInstitucionColumn(columns, 'codigo_modular')},
        ${selectInstitucionColumn(columns, 'ruc')},
        ${selectInstitucionColumn(columns, 'numero')},
        i.nombre,
        ${selectInstitucionColumn(columns, 'nivel_educativo')},
        ${selectInstitucionColumn(columns, 'modalidad')},
        ${selectInstitucionColumn(columns, 'provincia')},
        ${selectInstitucionColumn(columns, 'distrito')},
        d.id AS director_id,
        CONCAT(d.nombres, ' ', d.apellido_paterno, ' ', COALESCE(d.apellido_materno, '')) AS director,
        d.email AS director_email,
        GROUP_CONCAT(DISTINCT u.nombre ORDER BY u.nombre SEPARATOR ', ') AS especialistas
      FROM instituciones i
      LEFT JOIN directores d ON d.institucion_id = i.id
      LEFT JOIN especialista_instituciones ei ON ei.institucion_id = i.id
      LEFT JOIN usuarios u ON u.id = ei.especialista_id
      GROUP BY i.id, d.id
      ORDER BY i.nombre ASC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listando instituciones:', error);
    res.status(500).json({ success: false, message: 'Error al listar instituciones.' });
  }
};

const updateInstitucion = async (req, res) => {
  const { id } = req.params;
  const { codigo_modular, ruc, numero, nombre, nivel_educativo, modalidad, provincia, distrito } = req.body;

  if (!nombre || !nivel_educativo || !modalidad || !provincia) {
    return res.status(400).json({ success: false, message: 'Nombre, nivel, modalidad y provincia son requeridos.' });
  }

  try {
    const columns = await obtenerColumnasInstituciones();
    const candidates = [
      ['codigo_modular', codigo_modular || null],
      ['ruc', ruc || null],
      ['numero', numero || null],
      ['nombre', nombre],
      ['nivel_educativo', nivel_educativo],
      ['modalidad', modalidad],
      ['provincia', provincia],
      ['distrito', distrito || null],
    ].filter(([column]) => columns.has(column));

    if (candidates.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay campos compatibles para actualizar.' });
    }

    await pool.execute(
      `UPDATE instituciones
       SET ${candidates.map(([column]) => `${escapeIdentifier(column)} = ?`).join(', ')}
       WHERE id = ?`,
      [...candidates.map(([, value]) => value), id]
    );

    await logAuditoria({
      usuario_id: req.usuario?.id || 1,
      modulo: 'Administracion',
      accion: 'ACTUALIZAR',
      descripcion: `Actualizo la institucion ID ${id}.`,
      ip_address: req.ip
    });

    res.json({ success: true, message: 'Institucion actualizada correctamente.' });
  } catch (error) {
    console.error('Error actualizando institucion:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar institucion.' });
  }
};

const getEspecialistas = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT u.id, u.nombre, u.email
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE r.nombre = 'especialista' AND u.estado = 'activo'
      ORDER BY u.nombre ASC, u.email ASC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listando especialistas:', error);
    res.status(500).json({ success: false, message: 'Error al listar especialistas.' });
  }
};

const asignarEspecialista = async (req, res) => {
  const { institucionId, especialistaId } = req.body;

  if (!institucionId || !especialistaId) {
    return res.status(400).json({ success: false, message: 'institucionId y especialistaId son requeridos.' });
  }

  try {
    await asegurarTablasAdmin();
    await pool.execute(
      `INSERT IGNORE INTO especialista_instituciones (institucion_id, especialista_id, asignado_por)
       VALUES (?, ?, ?)`,
      [institucionId, especialistaId, req.usuario?.id || null]
    );

    await logAuditoria({
      usuario_id: req.usuario?.id || 1,
      modulo: 'Administracion',
      accion: 'CREAR',
      descripcion: `Asigno especialista ${especialistaId} a institucion ${institucionId}.`,
      ip_address: req.ip
    });

    res.json({ success: true, message: 'Especialista asignado correctamente.' });
  } catch (error) {
    console.error('Error asignando especialista:', error);
    res.status(500).json({ success: false, message: 'Error al asignar especialista.' });
  }
};

const quitarEspecialista = async (req, res) => {
  const { institucionId, especialistaId } = req.body;

  try {
    await asegurarTablasAdmin();
    await pool.execute(
      'DELETE FROM especialista_instituciones WHERE institucion_id = ? AND especialista_id = ?',
      [institucionId, especialistaId]
    );

    await logAuditoria({
      usuario_id: req.usuario?.id || 1,
      modulo: 'Administracion',
      accion: 'ELIMINAR',
      descripcion: `Quito especialista ${especialistaId} de institucion ${institucionId}.`,
      ip_address: req.ip
    });

    res.json({ success: true, message: 'Asignacion retirada correctamente.' });
  } catch (error) {
    console.error('Error retirando especialista:', error);
    res.status(500).json({ success: false, message: 'Error al retirar asignacion.' });
  }
};

const limpiarAsignacionesEspecialista = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, message: 'El especialista es requerido.' });
  }

  try {
    await asegurarTablasAdmin();
    const [result] = await pool.execute(
      'DELETE FROM especialista_instituciones WHERE especialista_id = ?',
      [id]
    );

    await logAuditoria({
      usuario_id: req.usuario?.id || 1,
      modulo: 'Administracion',
      accion: 'ELIMINAR',
      descripcion: `Limpio ${result.affectedRows || 0} asignaciones del especialista ${id}.`,
      ip_address: req.ip
    });

    res.json({
      success: true,
      message: 'Asignaciones retiradas. Si el especialista no tiene asignaciones, vera todas las instituciones.',
      totalEliminadas: result.affectedRows || 0
    });
  } catch (error) {
    console.error('Error limpiando asignaciones del especialista:', error);
    res.status(500).json({ success: false, message: 'Error al limpiar asignaciones del especialista.' });
  }
};

const asignacionMasiva = async (req, res) => {
  const { especialistaId, institucionIds, replace = true } = req.body;

  if (!especialistaId || !Array.isArray(institucionIds) || institucionIds.length === 0) {
    return res.status(400).json({ success: false, message: 'especialistaId e institucionIds son requeridos.' });
  }

  const ids = [...new Set(institucionIds.map((id) => Number(id)).filter(Boolean))];
  if (ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No hay instituciones validas para asignar.' });
  }

  const connection = await pool.getConnection();

  try {
    await asegurarTablasAdmin();
    await connection.beginTransaction();

    if (replace) {
      await connection.execute(
        'DELETE FROM especialista_instituciones WHERE especialista_id = ?',
        [especialistaId]
      );
    }

    await connection.query(
      `INSERT IGNORE INTO especialista_instituciones (especialista_id, institucion_id, asignado_por)
       VALUES ?`,
      [ids.map((institucionId) => [especialistaId, institucionId, req.usuario?.id || null])]
    );

    await connection.commit();

    await logAuditoria({
      usuario_id: req.usuario?.id || 1,
      modulo: 'Administracion',
      accion: 'ACTUALIZAR',
      descripcion: `Asignacion masiva de ${ids.length} instituciones al especialista ${especialistaId}.`,
      ip_address: req.ip
    });

    res.json({ success: true, message: 'Asignacion masiva completada.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error en asignacion masiva:', error);
    res.status(500).json({ success: false, message: 'Error al realizar la asignacion masiva.' });
  } finally {
    connection.release();
  }
};

const getProrrogas = async (req, res) => {
  try {
    await asegurarTablasAdmin();

    const [rows] = await pool.execute(`
      SELECT
        pp.id,
        pp.director_id,
        pp.anio,
        pp.trimestre,
        pp.fecha_limite,
        pp.motivo,
        pp.actualizado_en,
        i.numero,
        i.nombre AS institucion,
        CONCAT(d.nombres, ' ', d.apellido_paterno, ' ', COALESCE(d.apellido_materno, '')) AS director
      FROM periodo_prorrogas pp
      LEFT JOIN directores d ON d.id = pp.director_id
      LEFT JOIN instituciones i ON i.id = d.institucion_id
      ORDER BY pp.actualizado_en DESC
      LIMIT 80
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listando prorrogas:', error);
    res.status(500).json({ success: false, message: 'Error al listar prorrogas.' });
  }
};

const upsertProrroga = async (req, res) => {
  const { directorId, anio, trimestre, fechaLimite, motivo } = req.body;
  const fechaMysql = toMysqlDateTime(fechaLimite);

  if (!directorId || !anio || !trimestre || !fechaMysql) {
    return res.status(400).json({ success: false, message: 'directorId, anio, trimestre y fechaLimite son requeridos.' });
  }

  try {
    await asegurarTablasAdmin();
    await pool.execute(
      `INSERT INTO periodo_prorrogas (director_id, anio, trimestre, fecha_limite, motivo, creado_por)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        fecha_limite = VALUES(fecha_limite),
        motivo = VALUES(motivo),
        creado_por = VALUES(creado_por)`,
      [directorId, anio, trimestre, fechaMysql, motivo || null, req.usuario?.id || null]
    );

    await pool.execute(
      `INSERT INTO admin_cierre_historial (director_id, anio, trimestre, accion, motivo, usuario_id, ip_address)
       VALUES (?, ?, ?, 'prorroga', ?, ?, ?)`,
      [directorId, anio, trimestre, motivo || `Fecha limite: ${fechaMysql}`, req.usuario?.id || null, req.ip || null]
    );

    await logAuditoria({
      usuario_id: req.usuario?.id || 1,
      modulo: 'Administracion',
      accion: 'ACTUALIZAR',
      descripcion: `Registro prorroga para director ${directorId}, trimestre ${trimestre}-${anio}, hasta ${fechaMysql}.`,
      ip_address: req.ip
    });

    res.json({ success: true, message: 'Prorroga registrada correctamente.' });
  } catch (error) {
    console.error('Error guardando prorroga:', error);
    res.status(500).json({ success: false, message: 'Error al guardar la prorroga.' });
  }
};

const getCierreHistorial = async (req, res) => {
  try {
    await asegurarTablasAdmin();

    const [rows] = await pool.execute(`
      SELECT
        h.id,
        h.director_id,
        h.anio,
        h.trimestre,
        h.accion,
        h.motivo,
        h.fecha,
        h.ip_address,
        u.email AS admin_email,
        i.numero,
        i.nombre AS institucion
      FROM admin_cierre_historial h
      LEFT JOIN usuarios u ON u.id = h.usuario_id
      LEFT JOIN directores d ON d.id = h.director_id
      LEFT JOIN instituciones i ON i.id = d.institucion_id
      ORDER BY h.fecha DESC
      LIMIT 100
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listando historial de cierres:', error);
    res.status(500).json({ success: false, message: 'Error al listar historial.' });
  }
};

const cambiarCierreAdmin = async (req, res) => {
  const { directorId, anio, trimestre, accion, motivo } = req.body;

  if (!directorId || !anio || !trimestre || !['cerrar', 'reabrir'].includes(accion)) {
    return res.status(400).json({ success: false, message: 'Datos de cierre invalidos.' });
  }

  try {
    await pool.execute(
      `CREATE TABLE IF NOT EXISTS cierres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        director_id INT NOT NULL,
        anio INT NOT NULL,
        trimestre TINYINT NOT NULL,
        cerrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_cierres_trimestre (director_id, anio, trimestre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    if (accion === 'cerrar') {
      await pool.execute(
        `INSERT IGNORE INTO cierres (director_id, anio, trimestre)
         VALUES (?, ?, ?)`,
        [directorId, anio, trimestre]
      );
      await pool.execute(
        `INSERT INTO estados (director_id, trimestre, anio, estado, fecha_envio)
         VALUES (?, ?, ?, 'Enviado', NOW())
         ON DUPLICATE KEY UPDATE estado = IF(estado = 'Aprobado', estado, 'Enviado'), fecha_envio = IFNULL(fecha_envio, NOW())`,
        [directorId, trimestre, anio]
      );
    } else {
      await pool.execute(
        'DELETE FROM cierres WHERE director_id = ? AND anio = ? AND trimestre = ?',
        [directorId, anio, trimestre]
      );
      await pool.execute(
        `INSERT INTO estados (director_id, trimestre, anio, estado)
         VALUES (?, ?, ?, 'Borrador')
         ON DUPLICATE KEY UPDATE estado = IF(estado = 'Aprobado', estado, 'Borrador')`,
        [directorId, trimestre, anio]
      );
    }

    await asegurarTablasAdmin();
    await pool.execute(
      `INSERT INTO admin_cierre_historial (director_id, anio, trimestre, accion, motivo, usuario_id, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [directorId, anio, trimestre, accion, motivo || null, req.usuario?.id || null, req.ip || null]
    );

    await logAuditoria({
      usuario_id: req.usuario?.id || 1,
      modulo: 'Administracion',
      accion: 'ACTUALIZAR',
      descripcion: `Admin ejecuto ${accion} del trimestre ${trimestre}-${anio} para director ${directorId}.`,
      ip_address: req.ip
    });

    res.json({ success: true, message: accion === 'cerrar' ? 'Trimestre cerrado por admin.' : 'Trimestre reabierto por admin.' });
  } catch (error) {
    console.error('Error cambiando cierre admin:', error);
    res.status(500).json({ success: false, message: 'Error al cambiar cierre.' });
  }
};

const reabrirCierresMasivo = async (req, res) => {
  const { anio, trimestre, motivo } = req.body;

  if (!anio || !trimestre) {
    return res.status(400).json({ success: false, message: 'anio y trimestre son requeridos.' });
  }

  const connection = await pool.getConnection();

  try {
    await asegurarTablasAdmin();
    await asegurarTablaCierresAdmin(connection);

    await connection.beginTransaction();

    const [cierresRows] = await connection.execute(
      'SELECT director_id FROM cierres WHERE anio = ? AND trimestre = ?',
      [anio, trimestre]
    );

    if (cierresRows.length > 0) {
      await connection.query(
        `INSERT INTO admin_cierre_historial (director_id, anio, trimestre, accion, motivo, usuario_id, ip_address)
         VALUES ?`,
        [cierresRows.map((row) => [
          row.director_id,
          anio,
          trimestre,
          'reabrir_todos',
          motivo || 'Reapertura masiva del periodo',
          req.usuario?.id || null,
          req.ip || null
        ])]
      );
    }

    const [deleteResult] = await connection.execute(
      'DELETE FROM cierres WHERE anio = ? AND trimestre = ?',
      [anio, trimestre]
    );

    await connection.execute(
      `UPDATE estados
       SET estado = 'Borrador', fecha_actualizacion = NOW()
       WHERE anio = ? AND trimestre = ? AND estado <> 'Aprobado'`,
      [anio, trimestre]
    );

    await connection.commit();

    await logAuditoria({
      usuario_id: req.usuario?.id || 1,
      modulo: 'Administracion',
      accion: 'ACTUALIZAR',
      descripcion: `Admin reabrio masivamente el trimestre ${trimestre}-${anio}. Cierres retirados: ${deleteResult.affectedRows || 0}.`,
      ip_address: req.ip
    });

    res.json({
      success: true,
      message: 'Trimestre reabierto para todos los colegios con cierre registrado.',
      totalReabiertos: deleteResult.affectedRows || 0
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error reabriendo cierres masivamente:', error);
    res.status(500).json({ success: false, message: 'Error al reabrir el trimestre para todos.' });
  } finally {
    connection.release();
  }
};

const getConsolidadoManualAdmin = async (req, res) => {
  const anio = Number(req.query.anio || new Date().getFullYear());
  const trimestre = Number(req.query.trimestre || 1);

  if (!anio || ![1, 2, 3, 4].includes(trimestre)) {
    return res.status(400).json({ success: false, message: 'anio y trimestre son invalidos.' });
  }

  try {
    const months = getQuarterMonths(trimestre);

    const [rows] = await pool.execute(
      `
      SELECT
        d.id AS director_id,
        i.numero AS numero_ie,
        i.nombre AS institucion,
        CONCAT(d.nombres, ' ', d.apellido_paterno, ' ', COALESCE(d.apellido_materno, '')) AS director,
        COALESCE(e.estado, 'Borrador') AS estado,
        COALESCE(s.saldo_inicial, 0) AS saldo_inicial,
        COALESCE(s.saldo_mes1, 0) AS saldo_banco_mes1,
        COALESCE(s.saldo_mes2, 0) AS saldo_banco_mes2,
        COALESCE(s.saldo_mes3, 0) AS saldo_banco_mes3,
        SUM(CASE WHEN m.tipo_movimiento = 'INGRESO' AND MONTH(m.fecha) = ? THEN m.monto ELSE 0 END) AS ingreso_mes1,
        SUM(CASE WHEN m.tipo_movimiento = 'INGRESO' AND MONTH(m.fecha) = ? THEN m.monto ELSE 0 END) AS ingreso_mes2,
        SUM(CASE WHEN m.tipo_movimiento = 'INGRESO' AND MONTH(m.fecha) = ? THEN m.monto ELSE 0 END) AS ingreso_mes3,
        SUM(CASE WHEN m.tipo_movimiento = 'EGRESO' AND MONTH(m.fecha) = ? THEN m.monto ELSE 0 END) AS egreso_mes1,
        SUM(CASE WHEN m.tipo_movimiento = 'EGRESO' AND MONTH(m.fecha) = ? THEN m.monto ELSE 0 END) AS egreso_mes2,
        SUM(CASE WHEN m.tipo_movimiento = 'EGRESO' AND MONTH(m.fecha) = ? THEN m.monto ELSE 0 END) AS egreso_mes3,
        COUNT(CASE WHEN m.concepto LIKE ? THEN 1 END) AS registros_admin
      FROM directores d
      INNER JOIN instituciones i ON i.id = d.institucion_id
      LEFT JOIN estados e ON e.director_id = d.id AND e.anio = ? AND e.trimestre = ?
      LEFT JOIN saldos s ON s.director_id = d.id AND s.anio = ? AND s.trimestre = ?
      LEFT JOIN movimientos m
        ON m.director_id = d.id
       AND YEAR(m.fecha) = ?
       AND MONTH(m.fecha) BETWEEN ? AND ?
      GROUP BY
        d.id,
        i.numero,
        i.nombre,
        d.nombres,
        d.apellido_paterno,
        d.apellido_materno,
        e.estado,
        s.saldo_inicial,
        s.saldo_mes1,
        s.saldo_mes2,
        s.saldo_mes3
      ORDER BY i.nombre ASC
      `,
      [
        months[0], months[1], months[2],
        months[0], months[1], months[2],
        `${ADMIN_MANUAL_CONCEPT_PREFIX}%`,
        anio, trimestre,
        anio, trimestre,
        anio, months[0], months[2],
      ]
    );

    const data = rows.map((row) => {
      const ingresosMensuales = [row.ingreso_mes1, row.ingreso_mes2, row.ingreso_mes3].map((value) => Number(value || 0));
      const egresosMensuales = [row.egreso_mes1, row.egreso_mes2, row.egreso_mes3].map((value) => Number(value || 0));
      const saldosBancoMensuales = [row.saldo_banco_mes1, row.saldo_banco_mes2, row.saldo_banco_mes3].map((value) => Number(value || 0));
      const saldoInicialCaja = Number(row.saldo_inicial || 0);
      const totalIngresos = ingresosMensuales.reduce((sum, value) => sum + value, 0);
      const totalEgresos = egresosMensuales.reduce((sum, value) => sum + value, 0);
      const dineroEnCaja = saldoInicialCaja + totalIngresos - totalEgresos;
      const dineroEnBanco = saldosBancoMensuales[2] || 0;

      return {
        directorId: row.director_id,
        numeroIE: row.numero_ie,
        institucion: row.institucion,
        director: row.director,
        estado: row.estado,
        saldoInicialCaja,
        ingresosMensuales,
        egresosMensuales,
        saldosBancoMensuales,
        totalIngresos,
        totalEgresos,
        dineroEnCaja,
        dineroEnBanco,
        saldoTotal: dineroEnCaja + dineroEnBanco,
        cargaManualAdmin: Number(row.registros_admin || 0) > 0,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error listando consolidado manual admin:', error);
    res.status(500).json({ success: false, message: 'Error al cargar consolidado administrativo.' });
  }
};

const saveConsolidadoManualAdmin = async (req, res) => {
  const {
    directorId,
    anio,
    trimestre,
    saldoInicialCaja,
    ingresosMensuales,
    egresosMensuales,
    saldosBancoMensuales,
    observacion,
    estadoDestino = 'Enviado',
  } = req.body;

  const periodoAnio = Number(anio);
  const periodoTrimestre = Number(trimestre);
  const ingresos = toMonthlyMoney(ingresosMensuales);
  const egresos = toMonthlyMoney(egresosMensuales);
  const saldosBanco = toMonthlyMoney(saldosBancoMensuales);
  const saldoInicial = toMoney(saldoInicialCaja ?? 0);
  const motivo = String(observacion || '').trim();
  const estadosPermitidos = ['Borrador', 'Enviado', 'Aprobado'];

  if (!directorId || !periodoAnio || ![1, 2, 3, 4].includes(periodoTrimestre)) {
    return res.status(400).json({ success: false, message: 'directorId, anio y trimestre son obligatorios.' });
  }

  if (!ingresos || !egresos || !saldosBanco || saldoInicial === null) {
    return res.status(400).json({ success: false, message: 'Los montos deben ser numericos y no negativos.' });
  }

  if (!motivo) {
    return res.status(400).json({ success: false, message: 'Registra un motivo para la auditoria.' });
  }

  if (!estadosPermitidos.includes(estadoDestino)) {
    return res.status(400).json({ success: false, message: 'Estado destino invalido.' });
  }

  const connection = await pool.getConnection();

  try {
    const { startDate, endDate, movementDates } = getQuarterDateRange(periodoAnio, periodoTrimestre);

    await asegurarTablaCierresAdmin(connection);
    await connection.beginTransaction();

    const [[directorInfo]] = await connection.execute(
      `SELECT d.id, i.nombre AS institucion, i.numero AS numero_ie
       FROM directores d
       INNER JOIN instituciones i ON i.id = d.institucion_id
       WHERE d.id = ?
       LIMIT 1`,
      [directorId]
    );

    if (!directorInfo) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'No se encontro el colegio seleccionado.' });
    }

    await connection.execute('INSERT IGNORE INTO comprobantes (nombre, activo) VALUES (?, 1)', ['Ajuste Manual UGEL']);
    const [[comprobante]] = await connection.execute('SELECT id FROM comprobantes WHERE nombre = ? LIMIT 1', ['Ajuste Manual UGEL']);

    await connection.execute(
      `DELETE FROM movimientos
       WHERE director_id = ? AND fecha BETWEEN ? AND ?`,
      [directorId, startDate, endDate]
    );

    const movimientos = [];
    ingresos.forEach((monto, index) => {
      if (monto <= 0) return;
      movimientos.push([
        directorId,
        'INGRESO',
        movementDates[index],
        comprobante.id,
        'ADMIN',
        `ADM-${periodoAnio}-T${periodoTrimestre}-${directorId}-ING-${index + 1}`,
        `${ADMIN_MANUAL_CONCEPT_PREFIX} Ingreso mes ${index + 1}. Motivo: ${motivo}`.substring(0, 255),
        monto,
        '#2563eb',
      ]);
    });

    egresos.forEach((monto, index) => {
      if (monto <= 0) return;
      movimientos.push([
        directorId,
        'EGRESO',
        movementDates[index],
        comprobante.id,
        'ADMIN',
        `ADM-${periodoAnio}-T${periodoTrimestre}-${directorId}-EGR-${index + 1}`,
        `${ADMIN_MANUAL_CONCEPT_PREFIX} Egreso mes ${index + 1}. Motivo: ${motivo}`.substring(0, 255),
        monto,
        '#e11d48',
      ]);
    });

    if (movimientos.length > 0) {
      await connection.query(
        `INSERT INTO movimientos
         (director_id, tipo_movimiento, fecha, comprobante_id, serie, numero_comprobante, concepto, monto, color)
         VALUES ?`,
        [movimientos]
      );
    }

    await connection.execute(
      `INSERT INTO saldos (director_id, anio, trimestre, saldo_inicial, saldo_mes1, saldo_mes2, saldo_mes3)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         saldo_inicial = VALUES(saldo_inicial),
         saldo_mes1 = VALUES(saldo_mes1),
         saldo_mes2 = VALUES(saldo_mes2),
         saldo_mes3 = VALUES(saldo_mes3),
         actualizado_en = CURRENT_TIMESTAMP`,
      [directorId, periodoAnio, periodoTrimestre, saldoInicial, saldosBanco[0], saldosBanco[1], saldosBanco[2]]
    );

    if (estadoDestino === 'Borrador') {
      await connection.execute(
        `INSERT INTO estados (director_id, trimestre, anio, estado)
         VALUES (?, ?, ?, 'Borrador')
         ON DUPLICATE KEY UPDATE estado = 'Borrador', comentario_observacion = NULL`,
        [directorId, periodoTrimestre, periodoAnio]
      );
      await connection.execute('DELETE FROM cierres WHERE director_id = ? AND anio = ? AND trimestre = ?', [directorId, periodoAnio, periodoTrimestre]);
    } else {
      await connection.execute(
        `INSERT IGNORE INTO cierres (director_id, anio, trimestre)
         VALUES (?, ?, ?)`,
        [directorId, periodoAnio, periodoTrimestre]
      );
      await connection.execute(
        `INSERT INTO estados (director_id, trimestre, anio, estado, fecha_envio, fecha_auditoria, comentario_observacion)
         VALUES (?, ?, ?, ?, NOW(), IF(? = 'Aprobado', NOW(), NULL), ?)
         ON DUPLICATE KEY UPDATE
           estado = VALUES(estado),
           fecha_envio = IFNULL(fecha_envio, NOW()),
           fecha_auditoria = IF(VALUES(estado) = 'Aprobado', NOW(), fecha_auditoria),
           comentario_observacion = VALUES(comentario_observacion)`,
        [directorId, periodoTrimestre, periodoAnio, estadoDestino, estadoDestino, motivo]
      );
    }

    await connection.commit();

    await logAuditoria({
      usuario_id: req.usuario?.id || 1,
      modulo: 'Administracion',
      accion: 'ACTUALIZAR',
      descripcion: `Admin reemplazo consolidado T${periodoTrimestre}-${periodoAnio} de ${directorInfo.numero_ie || '-'} ${directorInfo.institucion}. Estado: ${estadoDestino}.`.substring(0, 255),
      ip_address: req.ip
    });

    res.json({ success: true, message: 'Consolidado administrativo guardado correctamente.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error guardando consolidado manual admin:', error);
    res.status(500).json({ success: false, message: 'Error al guardar consolidado administrativo.' });
  } finally {
    connection.release();
  }
};

const updateEstadoConsolidadoAdmin = async (req, res) => {
  const { directorId, anio, trimestre, estado, comentario } = req.body;
  const estadosPermitidos = ['Borrador', 'Enviado', 'Observado', 'Aprobado'];

  if (!directorId || !anio || !trimestre || !estadosPermitidos.includes(estado)) {
    return res.status(400).json({ success: false, message: 'Datos de estado invalidos.' });
  }

  try {
    await asegurarTablaCierresAdmin(pool);

    if (estado === 'Borrador') {
      await pool.execute(
        `INSERT INTO estados (director_id, trimestre, anio, estado, comentario_observacion)
         VALUES (?, ?, ?, 'Borrador', ?)
         ON DUPLICATE KEY UPDATE estado = 'Borrador', comentario_observacion = VALUES(comentario_observacion)`,
        [directorId, trimestre, anio, comentario || null]
      );
      await pool.execute('DELETE FROM cierres WHERE director_id = ? AND anio = ? AND trimestre = ?', [directorId, anio, trimestre]);
    } else {
      if (estado === 'Enviado' || estado === 'Aprobado') {
        await pool.execute(
          `INSERT IGNORE INTO cierres (director_id, anio, trimestre)
           VALUES (?, ?, ?)`,
          [directorId, anio, trimestre]
        );
      }

      await pool.execute(
        `INSERT INTO estados (director_id, trimestre, anio, estado, comentario_observacion, fecha_envio, fecha_auditoria)
         VALUES (?, ?, ?, ?, ?, IF(? IN ('Enviado', 'Aprobado'), NOW(), NULL), IF(? = 'Aprobado', NOW(), NULL))
         ON DUPLICATE KEY UPDATE
           estado = VALUES(estado),
           comentario_observacion = VALUES(comentario_observacion),
           fecha_envio = IF(VALUES(estado) IN ('Enviado', 'Aprobado'), IFNULL(fecha_envio, NOW()), fecha_envio),
           fecha_auditoria = IF(VALUES(estado) = 'Aprobado', NOW(), fecha_auditoria)`,
        [directorId, trimestre, anio, estado, comentario || null, estado, estado]
      );
    }

    await logAuditoria({
      usuario_id: req.usuario?.id || 1,
      modulo: 'Administracion',
      accion: 'ACTUALIZAR',
      descripcion: `Admin cambio estado del director ${directorId} T${trimestre}-${anio} a ${estado}.`,
      ip_address: req.ip
    });

    res.json({ success: true, message: `Estado actualizado a ${estado}.` });
  } catch (error) {
    console.error('Error cambiando estado admin:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar estado.' });
  }
};

const resetPasswordAdmin = async (req, res) => {
  const { id } = req.params;
  const { password, forceChange = true } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'La nueva contrasena debe tener al menos 6 caracteres.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    await pool.execute(
      'UPDATE usuarios SET password_hash = ?, debe_cambiar_password = ? WHERE id = ?',
      [hashedPassword, forceChange ? 1 : 0, id]
    );

    await logAuditoria({
      usuario_id: req.usuario?.id || 1,
      modulo: 'Administracion',
      accion: 'CAMBIAR_PASSWORD',
      descripcion: `Admin restablecio la contrasena del usuario ID ${id}.`,
      ip_address: req.ip
    });

    res.json({ success: true, message: 'Contrasena restablecida correctamente.' });
  } catch (error) {
    console.error('Error restableciendo password:', error);
    res.status(500).json({ success: false, message: 'Error al restablecer la contrasena.' });
  }
};

const getAvisos = async (req, res) => {
  try {
    await asegurarTablasAdmin();

    const [rows] = await pool.execute(`
      SELECT id, titulo, mensaje, rol_destino, activo, visible_desde, visible_hasta, creado_en
      FROM avisos_globales
      ORDER BY creado_en DESC
      LIMIT 80
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listando avisos:', error);
    res.status(500).json({ success: false, message: 'Error al listar avisos.' });
  }
};

const getAvisosActivos = async (req, res) => {
  const rol = String(req.query.rol || 'todos').toLowerCase();

  try {
    await asegurarTablasAdmin();

    const [rows] = await pool.execute(
      `SELECT id, titulo, mensaje, rol_destino, visible_hasta
       FROM avisos_globales
       WHERE activo = 1
        AND (rol_destino = 'todos' OR rol_destino = ?)
        AND (visible_desde IS NULL OR visible_desde <= NOW())
        AND (visible_hasta IS NULL OR visible_hasta >= NOW())
       ORDER BY creado_en DESC
       LIMIT 5`,
      [rol]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error obteniendo avisos activos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener avisos.' });
  }
};

const createAviso = async (req, res) => {
  const { titulo, mensaje, rolDestino = 'todos', visibleDesde, visibleHasta } = req.body;

  if (!titulo || !mensaje) {
    return res.status(400).json({ success: false, message: 'Titulo y mensaje son requeridos.' });
  }

  try {
    await asegurarTablasAdmin();
    await pool.execute(
      `INSERT INTO avisos_globales (titulo, mensaje, rol_destino, visible_desde, visible_hasta, creado_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        String(titulo).trim(),
        String(mensaje).trim(),
        String(rolDestino || 'todos').toLowerCase(),
        toMysqlDateTime(visibleDesde),
        toMysqlDateTime(visibleHasta),
        req.usuario?.id || null
      ]
    );

    await logAuditoria({
      usuario_id: req.usuario?.id || 1,
      modulo: 'Administracion',
      accion: 'CREAR',
      descripcion: `Creo aviso global: ${titulo}.`,
      ip_address: req.ip
    });

    res.status(201).json({ success: true, message: 'Aviso creado correctamente.' });
  } catch (error) {
    console.error('Error creando aviso:', error);
    res.status(500).json({ success: false, message: 'Error al crear aviso.' });
  }
};

const toggleAviso = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  try {
    await asegurarTablasAdmin();
    await pool.execute('UPDATE avisos_globales SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);

    await logAuditoria({
      usuario_id: req.usuario?.id || 1,
      modulo: 'Administracion',
      accion: 'ACTUALIZAR',
      descripcion: `Cambio estado del aviso global ID ${id}.`,
      ip_address: req.ip
    });

    res.json({ success: true, message: 'Aviso actualizado.' });
  } catch (error) {
    console.error('Error actualizando aviso:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar aviso.' });
  }
};

const getAdminComprobantes = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, nombre, activo FROM comprobantes ORDER BY nombre ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listando comprobantes admin:', error);
    res.status(500).json({ success: false, message: 'Error al listar comprobantes.' });
  }
};

const createAdminComprobante = async (req, res) => {
  const { nombre } = req.body;

  if (!String(nombre || '').trim()) {
    return res.status(400).json({ success: false, message: 'El nombre del comprobante es requerido.' });
  }

  try {
    await pool.execute(
      'INSERT IGNORE INTO comprobantes (nombre, activo) VALUES (?, 1)',
      [String(nombre).trim()]
    );

    await logAuditoria({
      usuario_id: req.usuario?.id || 1,
      modulo: 'Administracion',
      accion: 'CREAR',
      descripcion: `Creo comprobante ${nombre}.`,
      ip_address: req.ip
    });

    res.status(201).json({ success: true, message: 'Comprobante creado.' });
  } catch (error) {
    console.error('Error creando comprobante:', error);
    res.status(500).json({ success: false, message: 'Error al crear comprobante.' });
  }
};

const updateAdminComprobante = async (req, res) => {
  const { id } = req.params;
  const { nombre, activo } = req.body;

  if (!String(nombre || '').trim()) {
    return res.status(400).json({ success: false, message: 'El nombre del comprobante es requerido.' });
  }

  try {
    await pool.execute(
      'UPDATE comprobantes SET nombre = ?, activo = ? WHERE id = ?',
      [String(nombre).trim(), activo ? 1 : 0, id]
    );

    await logAuditoria({
      usuario_id: req.usuario?.id || 1,
      modulo: 'Administracion',
      accion: 'ACTUALIZAR',
      descripcion: `Actualizo comprobante ID ${id}.`,
      ip_address: req.ip
    });

    res.json({ success: true, message: 'Comprobante actualizado.' });
  } catch (error) {
    console.error('Error actualizando comprobante:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar comprobante.' });
  }
};

module.exports = {
  downloadBackup,
  getAuditoriaLogs,
  getLoginLogs,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getDashboardResumen,
  getPeriodos,
  updatePeriodo,
  getInstituciones,
  updateInstitucion,
  getEspecialistas,
  asignarEspecialista,
  asignacionMasiva,
  quitarEspecialista,
  limpiarAsignacionesEspecialista,
  getProrrogas,
  upsertProrroga,
  getCierreHistorial,
  cambiarCierreAdmin,
  reabrirCierresMasivo,
  resetPasswordAdmin,
  getAvisos,
  getAvisosActivos,
  createAviso,
  toggleAviso,
  getConsolidadoManualAdmin,
  saveConsolidadoManualAdmin,
  updateEstadoConsolidadoAdmin,
  getAdminComprobantes,
  createAdminComprobante,
  updateAdminComprobante
};
