const { pool } = require('../config/db');

const normalizarComprobantes = async () => {
  const [boletas] = await pool.query(
    `SELECT id, nombre
     FROM comprobantes
     WHERE nombre IN ('Boleta Venta', 'Boleta Electrónica', 'Boleta Venta Electrónica')
     ORDER BY id ASC`
  );

  const boletaUnificada = boletas.find((item) => item.nombre === 'Boleta Venta Electrónica');
  const boletaVenta = boletas.find((item) => item.nombre === 'Boleta Venta');
  const boletaElectronica = boletas.find((item) => item.nombre === 'Boleta Electrónica');

  if (!boletaUnificada && boletaVenta) {
    await pool.query(
      'UPDATE comprobantes SET nombre = ?, activo = 1 WHERE id = ?',
      ['Boleta Venta Electrónica', boletaVenta.id]
    );
  } else if (!boletaUnificada && boletaElectronica) {
    await pool.query(
      'UPDATE comprobantes SET nombre = ?, activo = 1 WHERE id = ?',
      ['Boleta Venta Electrónica', boletaElectronica.id]
    );
  } else if (!boletaUnificada) {
    await pool.query(
      'INSERT IGNORE INTO comprobantes (nombre, activo) VALUES (?, 1)',
      ['Boleta Venta Electrónica']
    );
  }

  await pool.query(
    "UPDATE comprobantes SET activo = 0 WHERE nombre IN ('Boleta Venta', 'Boleta Electrónica')"
  );
};

exports.getComprobantes = async (req, res) => {
  try {
    const tipo = String(req.query.tipo || '').toLowerCase();

    await normalizarComprobantes();

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
