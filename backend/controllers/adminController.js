const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { logAuditoria } = require('../utils/auditLogger');
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');


const downloadBackup = (req, res) => {
  // Extraemos las credenciales desde las variables de entorno (.env)
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  
  // Generamos un nombre dinámico con la fecha y hora actual
  const date = new Date();
  const timestamp = date.toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `backup_${DB_NAME}_${timestamp}.sql`;
  
  // Lo guardaremos temporalmente en la carpeta uploads
  const backupPath = path.join(__dirname, '..', 'uploads', filename);

  // Construimos el comando mysqldump
  const passwordFlag = DB_PASSWORD ? `-p${DB_PASSWORD}` : '';
  const dumpCommand = `mysqldump -h ${DB_HOST} -u ${DB_USER} ${passwordFlag} ${DB_NAME} > "${backupPath}"`;

  // Ejecutamos el comando en la terminal del servidor
  exec(dumpCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generando backup: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Error interno al generar el archivo .sql' });
    }

    // Si el comando fue exitoso, forzamos la descarga en el navegador
    res.download(backupPath, filename, async (err) => {
      if (err) {
        console.error('Error enviando el archivo al cliente:', err);
      } else {
        // ¡AQUÍ REGISTRAMOS LA AUDITORÍA!
        await logAuditoria({
          usuario_id: req.usuario?.id || 1, // Toma el ID del token JWT
          modulo: 'Administración',
          accion: 'DESCARGAR',
          descripcion: `El administrador generó y descargó un Backup de la BD (${filename})`,
          ip_address: req.ip
        });
      }

      // Limpieza: Eliminamos el archivo temporal del servidor después de enviarlo
      fs.unlink(backupPath, (unlinkErr) => { if (unlinkErr) console.error('Error eliminando temporal:', unlinkErr); });
    });
  });
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

module.exports = { downloadBackup, getAuditoriaLogs, getLoginLogs, getUsers, createUser, updateUser, deleteUser };
