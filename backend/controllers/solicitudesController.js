const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { logAuditoria } = require('../utils/auditLogger');

// Configuramos el transportador de nodemailer (usa las variables de tu .env)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'mail.ugelsanta.gob.pe',
  port: process.env.EMAIL_PORT || 465,
  secure: process.env.EMAIL_SECURE === 'true' || true,
  auth: {
    user: process.env.EMAIL_USER || 'recursos_propios_ie@ugelsanta.gob.pe',
    pass: process.env.EMAIL_PASS
  }
});

// POST /api/solicitudes-reemplazo
const crearSolicitud = async (req, res) => {
  try {
    const { directorId, school, motivo, nuevoCorreo, telefono } = req.body;
    
    // 1. Verificamos si ya existe una solicitud pendiente para esta escuela
    const [existente] = await pool.query(
      'SELECT id FROM solicitudes WHERE escuela = ? AND estado = "pendiente"',
      [school]
    );

    if (existente.length > 0) {
      return res.status(400).json({ success: false, message: 'Ya tienes una solicitud de cambio de credenciales en proceso para esta institución. Por favor, espera a que sea revisada.' });
    }

    const [result] = await pool.query(
      'INSERT INTO solicitudes (director_id, escuela, motivo, nuevo_correo, telefono) VALUES (?, ?, ?, ?, ?)',
      [directorId, school, motivo, nuevoCorreo, telefono]
    );
    
    // Registrar en auditoría la petición de credenciales
    try {
      const [userRows] = await pool.query('SELECT id FROM usuarios WHERE director_id = ? LIMIT 1', [directorId]);
      const usuario_id = userRows.length > 0 ? userRows[0].id : (req.usuario?.id || req.user?.id || 1);
      await logAuditoria({
        usuario_id: usuario_id,
        modulo: 'Credenciales',
        accion: 'SOL_CREDENCIAL',
        descripcion: `Se solicitó cambio de credenciales para la I.E. ${school}`,
        ip_address: req.ip || req.connection?.remoteAddress
      });
    } catch (auditError) {
      console.error('No se pudo guardar la auditoría:', auditError);
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Solicitud creada con éxito', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor al crear la solicitud.' });
  }
};

// GET /api/solicitudes-reemplazo
const obtenerSolicitudes = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id, 
        director_id, 
        escuela AS school, 
        motivo, 
        nuevo_correo AS nuevoCorreo, 
        telefono, 
        estado, 
        fecha_creacion 
      FROM solicitudes 
      ORDER BY fecha_creacion DESC
    `);
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ success: false, message: 'Error al consultar las solicitudes.' });
  }
};

// PUT /api/solicitudes-reemplazo/:id
const procesarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // Puede ser 'aprobado' o 'rechazado'

    const [solicitudes] = await pool.query('SELECT director_id, escuela, nuevo_correo FROM solicitudes WHERE id = ?', [id]);
    if (solicitudes.length === 0) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada.' });
    }
    
    const solicitud = solicitudes[0];
    // Generar una contraseña temporal aleatoria de 8 caracteres (ej. 'a1b2c3d4')
    let passwordTemporal = crypto.randomBytes(4).toString('hex');

    // Si se aprueba, asignamos el nuevo correo al director y forzamos el cambio de contraseña
    if (estado === 'aprobado') {
      // 1. Generamos una contraseña temporal "123456" para el nuevo usuario
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(passwordTemporal, salt);

      // 2. Actualizamos la tabla de directores con el nuevo correo
      await pool.query(
        'UPDATE directores SET email = ? WHERE id = ?', 
        [solicitud.nuevo_correo, solicitud.director_id]
      );

      // 3. Actualizamos la tabla de usuarios (login) con el correo, clave temporal y forzamos el cambio
      await pool.query(
        'UPDATE usuarios SET email = ?, password_hash = ?, debe_cambiar_password = 1 WHERE director_id = ?', 
        [solicitud.nuevo_correo, hashedPassword, solicitud.director_id]
      );
    }

    // Actualizamos el estado final de la solicitud
    await pool.query('UPDATE solicitudes SET estado = ? WHERE id = ?', [estado, id]);
    
    // 4. Intentamos enviar el correo de notificación al director
    try {
      let mailOptions = {
        from: `"Sistema UGEL" <${process.env.EMAIL_USER || 'recursos_propios_ie@ugelsanta.gob.pe'}>`,
        to: solicitud.nuevo_correo,
        subject: estado === 'aprobado' ? '✅ Solicitud de Credenciales Aprobada' : '❌ Solicitud de Credenciales Rechazada',
        html: estado === 'aprobado' 
          ? `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #10b981; padding: 20px; text-align: center; color: white;">
                <h2 style="margin: 0;">¡Solicitud Aprobada!</h2>
              </div>
              <div style="padding: 20px; color: #334155;">
                <p>Hola,</p>
                <p>Tu solicitud de actualización de credenciales para la institución <strong>${solicitud.escuela}</strong> ha sido aprobada por la UGEL.</p>
                <p>Tus nuevos datos de acceso son:</p>
                <ul style="background-color: #f8fafc; padding: 15px; border-radius: 6px; list-style: none;">
                  <li><strong>Correo:</strong> ${solicitud.nuevo_correo}</li>
                  <li><strong>Contraseña Temporal:</strong> ${passwordTemporal}</li>
                </ul>
                <p>⚠️ <em>Se te pedirá que cambies esta contraseña por una nueva cuando inicies sesión por primera vez.</em></p>
                <br/>
                <p>Atentamente,<br/><strong>El equipo de UGEL</strong></p>
              </div>
            </div>
          `
          : `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #ef4444; padding: 20px; text-align: center; color: white;">
                <h2 style="margin: 0;">Solicitud Rechazada</h2>
              </div>
              <div style="padding: 20px; color: #334155;">
                <p>Hola,</p>
                <p>Lamentamos informarte que tu solicitud de actualización de credenciales para <strong>${solicitud.escuela}</strong> ha sido rechazada tras la revisión de los especialistas.</p>
                <p>Por favor, comunícate directamente con la UGEL para obtener más información sobre los motivos del rechazo o para presentar una nueva solicitud con los datos o adjuntos correctos.</p>
                <br/>
                <p>Atentamente,<br/><strong>El equipo de UGEL</strong></p>
              </div>
            </div>
          `
      };
      await transporter.sendMail(mailOptions);
    } catch (mailError) {
      console.error('Error al enviar correo de notificación (pero la solicitud procedió):', mailError);
    }

    // Registrar en auditoría la aprobación o rechazo
    try {
      // Intentamos extraer el ID real del Especialista desde el Token
      let currentUserId = req.usuario?.id || req.user?.id;
      if (!currentUserId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'firma_secreta_ugel_2026');
          currentUserId = decoded.id;
        } catch (e) { /* Ignorar error de token aquí */ }
      }

      await logAuditoria({
        usuario_id: currentUserId || 1,
        modulo: 'Credenciales',
        accion: `SOL_${estado.toUpperCase()}`,
        descripcion: `El Especialista ${estado} la solicitud de credenciales de la I.E. ${solicitud.escuela}`,
        ip_address: req.ip || req.connection?.remoteAddress
      });
    } catch (auditError) {
      console.error('No se pudo guardar la auditoría:', auditError);
    }

    res.json({ success: true, message: `Solicitud ${estado} correctamente y notificación enviada.` });
  } catch (error) {
    console.error('Error al procesar solicitud:', error);
    res.status(500).json({ success: false, message: 'Error interno al procesar la solicitud.' });
  }
};

module.exports = { crearSolicitud, obtenerSolicitudes, procesarSolicitud };