const { pool } = require('../config/db');

const TABLAS_PERMITIDAS = {
  ingresos: 'ingresos',
  egresos: 'egresos',
};

const ESTADO_BLOQUEO_TRIMESTRE = 423;
let cierreTableReadyPromise = null;

const obtenerTabla = (tipo) => TABLAS_PERMITIDAS[tipo];

const asegurarTablaCierres = async (connection = pool) => {
  if (!cierreTableReadyPromise) {
    cierreTableReadyPromise = connection.execute(
      `CREATE TABLE IF NOT EXISTS cierres_trimestrales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        director_id INT NOT NULL,
        anio INT NOT NULL,
        trimestre TINYINT NOT NULL,
        cerrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_cierres_trimestrales_director
          FOREIGN KEY (director_id)
          REFERENCES directores(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT chk_cierres_trimestrales_trimestre
          CHECK (trimestre BETWEEN 1 AND 4),
        UNIQUE KEY uk_cierre_trimestre (director_id, anio, trimestre),
        INDEX idx_cierres_trimestrales_director (director_id, anio, trimestre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ).catch((error) => {
      cierreTableReadyPromise = null;
      throw error;
    });
  }

  await cierreTableReadyPromise;
};

const obtenerAnioYTrimestre = (fecha) => {
  const date = new Date(`${fecha}T00:00:00`);
  const month = date.getMonth();

  return {
    anio: date.getFullYear(),
    trimestre: Math.floor(month / 3) + 1,
  };
};

const validarPeriodoTrimestral = (startDate, endDate) => {
  const inicio = obtenerAnioYTrimestre(startDate);
  const fin = obtenerAnioYTrimestre(endDate);

  if (inicio.anio !== fin.anio || inicio.trimestre !== fin.trimestre) {
    return null;
  }

  return inicio;
};

const obtenerEstadoCierre = async (connection, directorId, anio, trimestre) => {
  await asegurarTablaCierres(connection);

  const [rows] = await connection.execute(
    `SELECT id, cerrado_en
     FROM cierres_trimestrales
     WHERE director_id = ? AND anio = ? AND trimestre = ?
     LIMIT 1`,
    [directorId, anio, trimestre]
  );

  return rows[0] || null;
};

const normalizarTexto = (valor) => String(valor || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const MAPA_TIPOS_COMPROBANTE = {
  factura: 'Factura',
  boleta: 'Boleta',
  cheque: 'Cheque',
  'voucher banco': 'Voucher Banco',
  'boleta venta': 'Boleta Venta',
  'boleta venta electronica': 'Boleta Venta Electrónica',
  'recibo por honorarios': 'Recibo por Honorarios',
  'declaracion jurada': 'Declaración Jurada',
};

const normalizarTipoComprobante = (tipo) => (
  MAPA_TIPOS_COMPROBANTE[normalizarTexto(tipo)] || ''
);

const registroTieneContenido = (registro) => (
  Boolean(registro?.fecha)
  || Boolean(String(registro?.numero_comprobante || '').trim())
  || Boolean(String(registro?.concepto || '').trim())
  || Number(registro?.monto || 0) > 0
  || Boolean(String(registro?.tipo_comprobante || '').trim())
);

const validarRegistro = (registro) => (
  registro
  && registro.fecha
  && normalizarTipoComprobante(registro.tipo_comprobante)
  && registro.numero_comprobante?.trim()
  && registro.concepto?.trim()
  && registro.monto !== ''
  && registro.monto !== null
  && registro.monto !== undefined
);

const listarMovimientos = async (req, res) => {
  const { tipo } = req.params;
  const { directorId, startDate, endDate } = req.query;
  const tabla = obtenerTabla(tipo);

  if (!tabla) {
    return res.status(400).json({ success: false, message: 'Tipo de movimiento no válido.' });
  }

  if (!directorId || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'directorId, startDate y endDate son requeridos.',
    });
  }

  const periodo = validarPeriodoTrimestral(startDate, endDate);

  if (!periodo) {
    return res.status(400).json({
      success: false,
      message: 'El rango enviado debe pertenecer a un solo trimestre.',
    });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, director_id, fecha, tipo_comprobante, numero_comprobante, concepto, monto
       FROM ${tabla}
       WHERE director_id = ? AND fecha BETWEEN ? AND ?
       ORDER BY fecha ASC, id ASC`,
      [directorId, startDate, endDate]
    );

    const cierre = await obtenerEstadoCierre(pool, directorId, periodo.anio, periodo.trimestre);

    return res.status(200).json({
      success: true,
      data: rows,
      meta: {
        trimestreCerrado: Boolean(cierre),
        cerradoEn: cierre?.cerrado_en || null,
        anio: periodo.anio,
        trimestre: periodo.trimestre,
      },
    });
  } catch (error) {
    console.error(`Error listando ${tabla}:`, error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

const guardarMovimientos = async (req, res) => {
  const { tipo } = req.params;
  const { directorId, startDate, endDate, registros } = req.body;
  const tabla = obtenerTabla(tipo);

  if (!tabla) {
    return res.status(400).json({ success: false, message: 'Tipo de movimiento no válido.' });
  }

  if (!directorId || !startDate || !endDate || !Array.isArray(registros)) {
    return res.status(400).json({
      success: false,
      message: 'directorId, startDate, endDate y registros son requeridos.',
    });
  }

  const periodo = validarPeriodoTrimestral(startDate, endDate);

  if (!periodo) {
    return res.status(400).json({
      success: false,
      message: 'El rango enviado debe pertenecer a un solo trimestre.',
    });
  }

  const filasTipoInvalido = registros
    .map((registro, index) => ({ registro, index }))
    .filter(({ registro }) => registroTieneContenido(registro) && !normalizarTipoComprobante(registro.tipo_comprobante))
    .map(({ index }) => index + 1);

  if (filasTipoInvalido.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Tipo de comprobante inválido en la(s) fila(s): ${filasTipoInvalido.join(', ')}.`,
    });
  }

  const registrosValidos = registros
    .filter(validarRegistro)
    .map((registro) => ({
      fecha: registro.fecha,
      tipo_comprobante: normalizarTipoComprobante(registro.tipo_comprobante),
      numero_comprobante: registro.numero_comprobante.trim(),
      concepto: registro.concepto.trim(),
      monto: Number(registro.monto),
    }));

  const connection = await pool.getConnection();

  try {
    const cierre = await obtenerEstadoCierre(connection, directorId, periodo.anio, periodo.trimestre);

    if (cierre) {
      return res.status(ESTADO_BLOQUEO_TRIMESTRE).json({
        success: false,
        message: `El trimestre ${periodo.trimestre} del ${periodo.anio} ya fue cerrado y no admite cambios.`,
      });
    }

    await connection.beginTransaction();

    await connection.execute(
      `DELETE FROM ${tabla}
       WHERE director_id = ? AND fecha BETWEEN ? AND ?`,
      [directorId, startDate, endDate]
    );

    if (registrosValidos.length > 0) {
      const values = registrosValidos.map((registro) => [
        directorId,
        registro.fecha,
        registro.tipo_comprobante,
        registro.numero_comprobante,
        registro.concepto,
        registro.monto,
      ]);

      await connection.query(
        `INSERT INTO ${tabla}
         (director_id, fecha, tipo_comprobante, numero_comprobante, concepto, monto)
         VALUES ?`,
        [values]
      );
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `${tabla} guardados correctamente.`,
      totalGuardados: registrosValidos.length,
    });
  } catch (error) {
    await connection.rollback();
    console.error(`Error guardando ${tabla}:`, error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
};

const obtenerCierreTrimestral = async (req, res) => {
  const { directorId, anio, trimestreId } = req.query;

  if (!directorId || !anio || !trimestreId) {
    return res.status(400).json({
      success: false,
      message: 'directorId, anio y trimestreId son requeridos.',
    });
  }

  try {
    const cierre = await obtenerEstadoCierre(pool, directorId, Number(anio), Number(trimestreId));

    return res.status(200).json({
      success: true,
      data: {
        trimestreCerrado: Boolean(cierre),
        cerradoEn: cierre?.cerrado_en || null,
      },
    });
  } catch (error) {
    console.error('Error obteniendo cierre trimestral:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

const cerrarTrimestre = async (req, res) => {
  const { directorId, anio, trimestreId } = req.body;

  if (!directorId || !anio || !trimestreId) {
    return res.status(400).json({
      success: false,
      message: 'directorId, anio y trimestreId son requeridos.',
    });
  }

  try {
    await asegurarTablaCierres(pool);

    // 1. Crear el candado del director en cierres_trimestrales
    await pool.execute(`
      INSERT IGNORE INTO cierres_trimestrales (director_id, anio, trimestre)
      VALUES (?, ?, ?)
    `, [directorId, anio, trimestreId]);

    // 2. Notificar a la tabla del especialista que el informe ya fue enviado
    await pool.execute(`
      INSERT INTO estado_trimestres (director_id, trimestre, anio, estado, fecha_envio)
      VALUES (?, ?, ?, 'Enviado', NOW())
      ON DUPLICATE KEY UPDATE estado = 'Enviado', fecha_envio = NOW()
    `, [directorId, trimestreId, anio]);

    const cierre = await obtenerEstadoCierre(pool, directorId, Number(anio), Number(trimestreId));

    return res.status(200).json({
      success: true,
      message: 'Trimestre cerrado correctamente.',
      data: {
        trimestreCerrado: true,
        cerradoEn: cierre?.cerrado_en || null,
      },
    });
  } catch (error) {
    console.error('Error cerrando trimestre:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

// Obtener saldos de la cuenta corriente
const obtenerSaldosBanco = async (req, res) => {
  try {
    const { directorId, trimestreId, anio } = req.query;

    if (!directorId || !trimestreId || !anio) {
      return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos.' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM saldos_cuenta_corriente WHERE director_id = ? AND anio = ? AND trimestre = ?',
      [directorId, anio, trimestreId]
    );

    res.json({
      success: true,
      data: rows.length > 0 ? rows[0] : null
    });
  } catch (error) {
    console.error('Error al obtener saldos del banco:', error);
    res.status(500).json({ success: false, message: 'Error del servidor al obtener saldos.' });
  }
};

// Guardar o actualizar saldos de la cuenta corriente
const guardarSaldosBanco = async (req, res) => {
  try {
    const { directorId, trimestreId, anio, saldos } = req.body;

    if (!directorId || !trimestreId || !anio || !saldos) {
      return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
    }

    // Usamos INSERT ... ON DUPLICATE KEY UPDATE aprovechando tu índice único "uk_saldos_banco_trimestre"
    const query = `
      INSERT INTO saldos_cuenta_corriente 
        (director_id, anio, trimestre, saldo_inicial, saldo_mes1, saldo_mes2, saldo_mes3)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        saldo_inicial = VALUES(saldo_inicial),
        saldo_mes1 = VALUES(saldo_mes1),
        saldo_mes2 = VALUES(saldo_mes2),
        saldo_mes3 = VALUES(saldo_mes3),
        actualizado_en = CURRENT_TIMESTAMP
    `;

    const values = [
      directorId,
      anio,
      trimestreId,
      saldos.saldo_inicial || 0,
      saldos.saldo_mes1 || 0,
      saldos.saldo_mes2 || 0,
      saldos.saldo_mes3 || 0
    ];

    await pool.execute(query, values);

    res.json({ success: true, message: 'Saldos guardados correctamente.' });
  } catch (error) {
    console.error('Error al guardar saldos del banco:', error);
    res.status(500).json({ success: false, message: 'Error del servidor al guardar saldos.' });
  }
};

module.exports = {
  listarMovimientos,
  guardarMovimientos,
  obtenerCierreTrimestral,
  cerrarTrimestre,
  obtenerSaldosBanco,
  guardarSaldosBanco
};
