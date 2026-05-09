const { pool } = require('../config/db');

exports.getComprobantes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM comprobantes WHERE activo = 1 ORDER BY id ASC');
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener comprobantes:', error);
    res.status(500).json({ success: false, message: 'Error al cargar los comprobantes' });
  }
};