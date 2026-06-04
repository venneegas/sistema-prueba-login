const { pool } = require('../config/db');

exports.getComprobantes = async (req, res) => {
  try {
    const tipo = String(req.query.tipo || '').toLowerCase();

    if (tipo === 'ingreso') {
      await pool.query(
        'INSERT IGNORE INTO comprobantes (nombre, activo) VALUES (?, 1)',
        ['Recibo Interno']
      );

      const [rows] = await pool.query(
        `SELECT id, nombre
         FROM comprobantes
         WHERE activo = 1 AND nombre IN ('Recibo Interno', 'Voucher Banco')
         ORDER BY FIELD(nombre, 'Recibo Interno', 'Voucher Banco')`
      );

      return res.status(200).json({ success: true, data: rows });
    }

    const [rows] = await pool.query(
      "SELECT id, nombre FROM comprobantes WHERE activo = 1 AND nombre <> 'Recibo Interno' ORDER BY id ASC"
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener comprobantes:', error);
    res.status(500).json({ success: false, message: 'Error al cargar los comprobantes' });
  }
};
