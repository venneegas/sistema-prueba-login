const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

// POST /api/solicitudes-reemplazo
const crearSolicitud = async (req, res) => {
  try {
    const { directorId, school, motivo, nuevoCorreo, telefono } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO solicitudes (director_id, escuela, motivo, nuevo_correo, telefono) VALUES (?, ?, ?, ?, ?)',
      [directorId, school, motivo, nuevoCorreo, telefono]
    );
    
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

    // Si se aprueba, asignamos el nuevo correo al director y forzamos el cambio de contraseña
    if (estado === 'aprobado') {
      const [solicitudes] = await pool.query('SELECT director_id, nuevo_correo FROM solicitudes WHERE id = ?', [id]);
      if (solicitudes.length === 0) {
        return res.status(404).json({ success: false, message: 'Solicitud no encontrada.' });
      }
      
      const solicitud = solicitudes[0];

      // 1. Generamos una contraseña temporal "123456" para el nuevo usuario
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);

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
    
    res.json({ success: true, message: `Solicitud ${estado} correctamente.` });
  } catch (error) {
    console.error('Error al procesar solicitud:', error);
    res.status(500).json({ success: false, message: 'Error interno al procesar la solicitud.' });
  }
};

module.exports = { crearSolicitud, obtenerSolicitudes, procesarSolicitud };