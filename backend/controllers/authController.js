const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true', // true para puerto 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // Importante para evitar errores de certificados autofirmados en cPanel
  }
});

const obtenerTieneColumnaDebeCambiarPassword = async (connection) => {
  const [columns] = await connection.execute(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'usuarios'
        AND COLUMN_NAME = 'debe_cambiar_password'
      LIMIT 1
    `
  );

  return columns.length > 0;
};

/**
 * LOGIN
 * Valida contra la tabla usuarios de MySQL usando bcrypt.
 * POST /api/auth/login
 * Body: { correo: "director@colegio.edu.pe", password: "contrasena" }
 */
const login = async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({
      success: false,
      message: 'Correo y contraseña son requeridos.'
    });
  }

  // Capturar datos del cliente para la auditoría de inicio de sesión
  const ipAddress = req.ip || req.connection?.remoteAddress || null;
  const userAgent = req.headers['user-agent'] || 'Desconocido';

  let connection;

  try {
    connection = await pool.getConnection();
    const tieneColumnaDebeCambiarPassword = await obtenerTieneColumnaDebeCambiarPassword(connection);

    const [usuarios] = await connection.execute(
      `
        SELECT
          id,
          email,
          password_hash,
          rol,
          nombre,
          director_id,
          ${tieneColumnaDebeCambiarPassword ? 'COALESCE(debe_cambiar_password, FALSE)' : 'FALSE'} AS debe_cambiar_password
        FROM usuarios
        WHERE email = ?
      `,
      [correo.trim()]
    );

    if (usuarios.length === 0) {
      await connection.execute(
        `INSERT INTO sesiones (email, exitoso, razon_fallo, ip_address, user_agent) VALUES (?, FALSE, 'Usuario no encontrado', ?, ?)`,
        [correo.trim(), ipAddress, userAgent]
      );
      return res.status(401).json({
        success: false,
        message: 'Correo o contrasena incorrectos.'
      });
    }

    const usuario = usuarios[0];
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValida) {
      await connection.execute(
        `INSERT INTO sesiones (usuario_id, email, exitoso, razon_fallo, ip_address, user_agent) VALUES (?, ?, FALSE, 'Contraseña incorrecta', ?, ?)`,
        [usuario.id, correo.trim(), ipAddress, userAgent]
      );
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos.'
      });
    }

    let directorData = null;

    if (usuario.director_id) {
      const [directores] = await connection.execute(
        `
          SELECT
            d.id,
            d.dni,
            d.nombres,
            d.apellido_paterno,
            d.apellido_materno,
            d.celular,
            d.email,
            d.institucion_id,
            i.numero AS numero_ie,
            i.nombre AS nombre_ie
          FROM directores d
          JOIN instituciones i ON d.institucion_id = i.id
          WHERE d.id = ?
        `,
        [usuario.director_id]
      );

      if (directores.length > 0) {
        directorData = directores[0];
      }
    }

    // Registrar log exitoso
    await connection.execute(
      `INSERT INTO sesiones (usuario_id, email, exitoso, ip_address, user_agent) VALUES (?, ?, TRUE, ?, ?)`,
      [usuario.id, correo.trim(), ipAddress, userAgent]
    );

    // Actualizar último login
    await connection.execute(
      `UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = ?`,
      [usuario.id]
    );

    connection.release();
    connection = null;

    const token = jwt.sign(
      { id: usuario.id, correo: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET || 'firma_secreta_ugel_2026',
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre || (usuario.rol === 'admin' ? 'Administrador' : 'Usuario'),
        rol: usuario.rol,
        debeCambiarPassword: Boolean(usuario.debe_cambiar_password),
        director: directorData
          ? {
              id: directorData.id,
              dni: directorData.dni,
              nombres: directorData.nombres,
              apellido_paterno: directorData.apellido_paterno,
              apellido_materno: directorData.apellido_materno,
              celular: directorData.celular,
              email: directorData.email,
              school: directorData.nombre_ie,
              numero_ie: directorData.numero_ie,
              institucion_id: directorData.institucion_id
            }
          : null
      }
    });
  } catch (error) {
    console.error('Error en login:', error.message);
    if (connection) {
      connection.release();
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * CAMBIO DE CONTRASENA
 * POST /api/auth/change-password
 * Cambio normal: { currentPassword: "actual", newPassword: "nueva" }
 * Primer ingreso: { newPassword: "nueva", isFirstLoginChange: true }
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword, isFirstLoginChange } = req.body;
  const userId = req.usuario?.id;

  if (!userId || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'No se pudo identificar al usuario o falta la nueva contraseña.'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'La nueva contraseña debe tener al menos 6 caracteres.'
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    const tieneColumnaDebeCambiarPassword = await obtenerTieneColumnaDebeCambiarPassword(connection);

    const [usuarios] = await connection.execute(
      `
        SELECT
          id,
          password_hash,
          ${tieneColumnaDebeCambiarPassword ? 'COALESCE(debe_cambiar_password, FALSE)' : 'FALSE'} AS debe_cambiar_password
        FROM usuarios
        WHERE id = ?
      `,
      [userId]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    const usuario = usuarios[0];
    const esCambioPrimerIngreso = Boolean(isFirstLoginChange);

    if (esCambioPrimerIngreso && !usuario.debe_cambiar_password) {
      return res.status(400).json({
        success: false,
        message: 'Este usuario ya no tiene un cambio obligatorio pendiente.'
      });
    }

    if (!esCambioPrimerIngreso) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña actual es requerida.'
        });
      }

      const passwordValida = await bcrypt.compare(currentPassword, usuario.password_hash);

      if (!passwordValida) {
        return res.status(401).json({
          success: false,
          message: 'Contraseña actual incorrecta.'
        });
      }
    }

    const mismaPassword = await bcrypt.compare(newPassword, usuario.password_hash);

    if (mismaPassword) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña no puede ser igual a la actual.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const [result] = await connection.execute(
      tieneColumnaDebeCambiarPassword
        ? 'UPDATE usuarios SET password_hash = ?, debe_cambiar_password = FALSE WHERE id = ?'
        : 'UPDATE usuarios SET password_hash = ? WHERE id = ?',
      [hashedPassword, usuario.id]
    );

    connection.release();
    connection = null;

    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar la contraseña.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente.',
      debeCambiarPassword: false
    });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    if (connection) {
      connection.release();
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.'
    });
  }
};

/**
 * SOLICITAR RECUPERACIÓN DE CONTRASEÑA
 * POST /api/auth/forgot-password
 * Body: { email: "director@colegio.edu.pe" }
 */
const solicitarRecuperacion = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'El correo es requerido.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [users] = await connection.execute('SELECT id, email FROM usuarios WHERE email = ?', [email]);

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'No existe una cuenta con este correo.' });
    }

    // Generar código de 6 dígitos
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expireTime = new Date();
    expireTime.setMinutes(expireTime.getMinutes() + 15); // Expira en 15 min

    // Guardar en la base de datos
    await connection.execute(
      'UPDATE usuarios SET reset_code = ?, reset_expires = ? WHERE id = ?',
      [resetCode, expireTime, users[0].id]
    );

    connection.release();
    connection = null;

    // Enviar el correo
    await transporter.sendMail({
      from: `"UGEL Soporte" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Código de Recuperación de Contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background-color: #1e3a8a; padding: 25px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">UGEL SANTA</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff; color: #334155;">
            <h2 style="margin-top: 0; color: #1e293b; font-size: 20px;">Recuperación de Contraseña</h2>
            <p style="font-size: 16px; line-height: 1.6;">Hola,</p>
            <p style="font-size: 16px; line-height: 1.6;">Hemos recibido una solicitud para restablecer el acceso a tu cuenta. Ingresa el siguiente código de seguridad de 6 dígitos en el sistema:</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0; border: 2px dashed #cbd5e1;">
              <span style="font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 8px;">${resetCode}</span>
            </div>
            
            <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 0;">Este código es válido por <strong>15 minutos</strong>. Si tú no solicitaste este cambio, puedes ignorar este mensaje de forma segura.</p>
          </div>
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 12px; color: #64748b; margin: 0;">Sistema de Gestión de Recursos Propios<br>UGEL Santa &copy; 2026</p>
          </div>
        </div>
      `
    });

    res.json({ success: true, message: 'Código enviado al correo electrónico.' });
  } catch (error) {
    console.error('Error enviando correo de recuperación:', error);
    if (connection) connection.release();
    res.status(500).json({ success: false, message: 'Error enviando el correo.' });
  }
};

/**
 * RESTABLECER LA CONTRASEÑA
 * POST /api/auth/reset-password
 * Body: { email: "director@...", codigo: "123456", nuevaPassword: "nueva" }
 */
const restablecerPassword = async (req, res) => {
  const { email, codigo, nuevaPassword } = req.body;

  if (!email || !codigo || !nuevaPassword) {
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id, reset_expires FROM usuarios WHERE email = ? AND reset_code = ?',
      [email, codigo]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Código incorrecto o correo inválido.' });
    }

    const usuario = users[0];
    if (new Date() > new Date(usuario.reset_expires)) {
      connection.release();
      return res.status(400).json({ success: false, message: 'El código ha expirado.' });
    }

    // Encriptar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nuevaPassword, salt);

    // Actualizar contraseña y limpiar el código de la BD
    await connection.execute(
      'UPDATE usuarios SET password_hash = ?, reset_code = NULL, reset_expires = NULL WHERE id = ?',
      [hashedPassword, usuario.id]
    );

    connection.release();
    connection = null;

    res.json({ success: true, message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    console.error('Error restableciendo contraseña:', error);
    if (connection) connection.release();
    res.status(500).json({ success: false, message: 'Error actualizando la contraseña.' });
  }
};

module.exports = { login, changePassword, solicitarRecuperacion, restablecerPassword };
