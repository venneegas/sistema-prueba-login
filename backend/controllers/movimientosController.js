const { pool } = require('../config/db');
const { logAuditoria } = require('../utils/auditLogger');
const { getFrontendUrl, renderInstitutionalEmail, sendSpecialistNotification } = require('../utils/mailer');

const TIPO_MOVIMIENTO = {
  ingresos: 'INGRESO',
  egresos: 'EGRESO',
};

const ESTADO_BLOQUEO_TRIMESTRE = 423;
let cierreTableReadyPromise = null;
let periodoConfigReadyPromise = null;
let periodoProrrogasReadyPromise = null;

const obtenerTipoMovimiento = (tipo) => TIPO_MOVIMIENTO[tipo];

const asegurarTablaCierres = async (connection = pool) => {
  if (!cierreTableReadyPromise) {
    cierreTableReadyPromise = connection.execute(
      `CREATE TABLE IF NOT EXISTS cierres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        director_id INT NOT NULL,
        anio INT NOT NULL,
        trimestre TINYINT NOT NULL,
        cerrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_cierres_director
          FOREIGN KEY (director_id)
          REFERENCES directores(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT chk_cierres_trimestre
          CHECK (trimestre BETWEEN 1 AND 4),
        UNIQUE KEY uk_cierres_trimestre (director_id, anio, trimestre),
        INDEX idx_cierres_director (director_id, anio, trimestre)
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

const asegurarTablaPeriodoConfig = async (connection = pool) => {
  if (!periodoConfigReadyPromise) {
    periodoConfigReadyPromise = connection.execute(
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
    ).catch((error) => {
      periodoConfigReadyPromise = null;
      throw error;
    });
  }

  await periodoConfigReadyPromise;
};

const asegurarTablaPeriodoProrrogas = async (connection = pool) => {
  if (!periodoProrrogasReadyPromise) {
    periodoProrrogasReadyPromise = connection.execute(
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
    ).catch((error) => {
      periodoProrrogasReadyPromise = null;
      throw error;
    });
  }

  await periodoProrrogasReadyPromise;
};

const obtenerFechaLimiteDefault = (anio, trimestre) => {
  const year = Number(anio);
  switch (String(trimestre)) {
    case '1': return new Date(year, 3, 30, 23, 59, 59);
    case '2': return new Date(year, 6, 31, 23, 59, 59);
    case '3': return new Date(year, 9, 31, 23, 59, 59);
    case '4': return new Date(year + 1, 0, 31, 23, 59, 59);
    default: return new Date(year, 11, 31, 23, 59, 59);
  }
};

const obtenerConfigPeriodo = async (req, res) => {
  const { anio, trimestreId, directorId } = req.query;

  if (!anio || !trimestreId) {
    return res.status(400).json({ success: false, message: 'anio y trimestreId son requeridos.' });
  }

  try {
    await asegurarTablaPeriodoConfig(pool);
    await asegurarTablaPeriodoProrrogas(pool);

    if (directorId) {
      const [prorrogaRows] = await pool.execute(
        `SELECT fecha_limite, motivo
         FROM periodo_prorrogas
         WHERE director_id = ? AND anio = ? AND trimestre = ?
         LIMIT 1`,
        [directorId, anio, trimestreId]
      );

      if (prorrogaRows[0]) {
        return res.json({
          success: true,
          data: {
            anio: Number(anio),
            trimestre: Number(trimestreId),
            fechaLimite: prorrogaRows[0].fecha_limite,
            descripcion: prorrogaRows[0].motivo || null,
            configurado: true,
            fuente: 'prorroga',
          },
        });
      }
    }

    const [rows] = await pool.execute(
      `SELECT fecha_limite, descripcion
       FROM periodo_config
       WHERE anio = ? AND trimestre = ?
       LIMIT 1`,
      [anio, trimestreId]
    );

    const fechaLimite = rows[0]?.fecha_limite || obtenerFechaLimiteDefault(anio, trimestreId);

    return res.json({
      success: true,
      data: {
        anio: Number(anio),
        trimestre: Number(trimestreId),
        fechaLimite,
        descripcion: rows[0]?.descripcion || null,
        configurado: Boolean(rows[0]),
        fuente: rows[0] ? 'global' : 'default',
      },
    });
  } catch (error) {
    console.error('Error obteniendo configuracion de periodo:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
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
     FROM cierres
     WHERE director_id = ? AND anio = ? AND trimestre = ?
     LIMIT 1`,
    [directorId, anio, trimestre]
  );

  return rows[0] || null;
};

const registroTieneContenido = (registro) => (
  Boolean(registro?.fecha)
  || Boolean(String(registro?.serie || '').trim())
  || Boolean(String(registro?.numero_comprobante || '').trim())
  || Boolean(String(registro?.concepto || '').trim())
  || Number(registro?.monto || 0) > 0
  || Boolean(registro?.comprobante_id)
);

const validarRegistro = (registro) => (
  registro
  && registro.fecha
  && registro.comprobante_id
  && registro.numero_comprobante?.trim()
  && registro.concepto?.trim()
  && registro.monto !== ''
  && registro.monto !== null
  && registro.monto !== undefined
);

const obtenerComprobantesPermitidos = async (tipoMovimiento, connection = pool) => {
  const sql = tipoMovimiento === 'INGRESO'
    ? `SELECT id
       FROM comprobantes
       WHERE activo = 1 AND nombre IN ('Recibo Interno', 'Voucher Banco')`
    : `SELECT id
       FROM comprobantes
       WHERE activo = 1
         AND nombre <> 'Recibo Interno'
         AND nombre <> 'Ajuste Manual UGEL'`;

  const [rows] = await connection.execute(sql);
  return new Set(rows.map((row) => Number(row.id)));
};

const listarMovimientos = async (req, res) => {
  const { tipo } = req.params;
  const { directorId, startDate, endDate } = req.query;
  const tipoMovimiento = obtenerTipoMovimiento(tipo);

  if (!tipoMovimiento) {
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
      `SELECT m.id, m.director_id, m.fecha, c.nombre as tipo_comprobante, m.comprobante_id, m.serie, m.numero_comprobante, m.concepto, m.monto, m.color
       FROM movimientos m
       JOIN comprobantes c ON m.comprobante_id = c.id
       WHERE m.director_id = ? AND m.tipo_movimiento = ? AND m.fecha BETWEEN ? AND ?
       ORDER BY fecha ASC, id ASC`,
      [directorId, tipoMovimiento, startDate, endDate]
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
    console.error(`Error listando movimientos (${tipo}):`, error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

const guardarMovimientos = async (req, res) => {
  const { tipo } = req.params;
  const { directorId, startDate, endDate, registros } = req.body;
  const tipoMovimiento = obtenerTipoMovimiento(tipo);

  if (!tipoMovimiento) {
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
    .filter(({ registro }) => registroTieneContenido(registro) && !registro.comprobante_id)
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
      comprobante_id: Number(registro.comprobante_id),
      serie: String(registro.serie || '').trim() || null,
      numero_comprobante: registro.numero_comprobante.trim(),
      concepto: registro.concepto.trim(),
      monto: Number(registro.monto),
      color: registro.color || null,
    }));

  const connection = await pool.getConnection();

  try {
    if (registrosValidos.length > 0) {
      const comprobantesPermitidos = await obtenerComprobantesPermitidos(tipoMovimiento, connection);
      const filasComprobanteNoPermitido = registros
        .map((registro, index) => ({ registro, index }))
        .filter(({ registro }) => (
          validarRegistro(registro)
          && !comprobantesPermitidos.has(Number(registro.comprobante_id))
        ))
        .map(({ index }) => index + 1);

      if (filasComprobanteNoPermitido.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Tipo de comprobante no permitido en la(s) fila(s): ${filasComprobanteNoPermitido.join(', ')}.`,
        });
      }
    }

    const cierre = await obtenerEstadoCierre(connection, directorId, periodo.anio, periodo.trimestre);

    if (cierre) {
      return res.status(ESTADO_BLOQUEO_TRIMESTRE).json({
        success: false,
        message: `El trimestre ${periodo.trimestre} del ${periodo.anio} ya fue cerrado y no admite cambios.`,
      });
    }

    await connection.beginTransaction();

    await connection.execute(
      `DELETE FROM movimientos
       WHERE director_id = ? AND tipo_movimiento = ? AND fecha BETWEEN ? AND ?`,
      [directorId, tipoMovimiento, startDate, endDate]
    );

    if (registrosValidos.length > 0) {
      const values = registrosValidos.map((registro) => [
        directorId,
        tipoMovimiento,
        registro.fecha,
        registro.comprobante_id,
        registro.serie,
        registro.numero_comprobante,
        registro.concepto,
        registro.monto,
        registro.color,
      ]);

      await connection.query(
        `INSERT INTO movimientos
         (director_id, tipo_movimiento, fecha, comprobante_id, serie, numero_comprobante, concepto, monto, color)
         VALUES ?`,
        [values]
      );
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Movimientos (${tipo}) guardados correctamente.`,
      totalGuardados: registrosValidos.length,
    });
  } catch (error) {
    await connection.rollback();
    console.error(`Error guardando movimientos (${tipo}):`, error);
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
    const [estadoRows] = await pool.execute(
      `SELECT estado, comentario_observacion, fecha_envio, fecha_auditoria, fecha_actualizacion
       FROM estados
       WHERE director_id = ? AND anio = ? AND trimestre = ?
       LIMIT 1`,
      [directorId, anio, trimestreId]
    );
    const estadoReporte = estadoRows[0] || null;

    return res.status(200).json({
      success: true,
      data: {
        trimestreCerrado: Boolean(cierre),
        cerradoEn: cierre?.cerrado_en || null,
        estadoReporte: estadoReporte ? {
          estado: estadoReporte.estado,
          comentarioObservacion: estadoReporte.comentario_observacion,
          fechaEnvio: estadoReporte.fecha_envio,
          fechaAuditoria: estadoReporte.fecha_auditoria,
          fechaActualizacion: estadoReporte.fecha_actualizacion,
        } : null,
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

    // 1. Crear el candado del director en cierres
    await pool.execute(`
      INSERT IGNORE INTO cierres (director_id, anio, trimestre)
      VALUES (?, ?, ?)
    `, [directorId, anio, trimestreId]);

    // 2. Notificar a la tabla del especialista que el informe ya fue enviado
    await pool.execute(`
      INSERT INTO estados (director_id, trimestre, anio, estado, fecha_envio)
      VALUES (?, ?, ?, 'Enviado', NOW())
      ON DUPLICATE KEY UPDATE
        fecha_envio = IF(estado = 'Aprobado', fecha_envio, NOW()),
        estado = IF(estado = 'Aprobado', estado, 'Enviado')
    `, [directorId, trimestreId, anio]);

  // Registrar auditoría del cierre de trimestre
  try {
    // Intentamos extraer el ID real del Director desde el Token
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
      modulo: 'Declaración',
      accion: 'CIERRE_TRIM',
      descripcion: `El director cerró la declaración del trimestre ${trimestreId} del año ${anio}.`,
      ip_address: req.ip || req.connection?.remoteAddress
    });
  } catch (err) { console.error('Error registrando auditoría:', err); }

    try {
      const [[directorInfo]] = await pool.execute(
        `SELECT
           d.nombres,
           d.apellido_paterno,
           d.apellido_materno,
           i.numero AS numero_ie,
           i.nombre AS nombre_ie
         FROM directores d
         INNER JOIN instituciones i ON d.institucion_id = i.id
         WHERE d.id = ?
         LIMIT 1`,
        [directorId]
      );

      const nombreDirector = directorInfo
        ? `${directorInfo.nombres || ''} ${directorInfo.apellido_paterno || ''} ${directorInfo.apellido_materno || ''}`.trim()
        : `Director ID ${directorId}`;
      const institucion = directorInfo
        ? `${directorInfo.numero_ie ? `${directorInfo.numero_ie} - ` : ''}${directorInfo.nombre_ie}`
        : `Director ID ${directorId}`;

      sendSpecialistNotification({
        subject: `Reporte enviado - ${institucion}`,
        text: `El director ${nombreDirector} envio el reporte del ${trimestreId} trimestre ${anio}.`,
        html: renderInstitutionalEmail({
          title: 'Reporte financiero enviado',
          intro: 'Un director ha cerrado y enviado su reporte trimestral para revision del especialista.',
          rows: [
            { label: 'Institucion', value: institucion },
            { label: 'Director', value: nombreDirector },
            { label: 'Periodo', value: `${trimestreId} trimestre ${anio}` },
            { label: 'Estado', value: 'Enviado' },
          ],
          actionLabel: 'Revisar reporte',
          actionUrl: getFrontendUrl(),
          note: 'El reporte ya figura como enviado en el panel de especialista.',
        })
      }).catch((mailError) => {
        console.error('Error al enviar aviso de reporte al especialista:', mailError);
      });
    } catch (mailSetupError) {
      console.error('Error preparando aviso de reporte al especialista:', mailSetupError);
    }

    const cierre = await obtenerEstadoCierre(pool, directorId, Number(anio), Number(trimestreId));

    return res.status(200).json({
      success: true,
      message: 'Trimestre cerrado correctamente.',
      data: {
        trimestreCerrado: true,
        cerradoEn: cierre?.cerrado_en || null,
        estadoReporte: {
          estado: 'Enviado',
          comentarioObservacion: null,
          fechaEnvio: new Date().toISOString(),
          fechaAuditoria: null,
          fechaActualizacion: new Date().toISOString(),
        },
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
      'SELECT * FROM saldos WHERE director_id = ? AND anio = ? AND trimestre = ?',
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

    const cierre = await obtenerEstadoCierre(pool, directorId, Number(anio), Number(trimestreId));
    if (cierre) {
      return res.status(ESTADO_BLOQUEO_TRIMESTRE).json({
        success: false,
        message: `El trimestre ${trimestreId} del ${anio} ya fue cerrado y no admite cambios en saldos.`,
      });
    }

    // Usamos INSERT ... ON DUPLICATE KEY UPDATE aprovechando tu índice único "uk_saldos_trimestre"
    const query = `
      INSERT INTO saldos 
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
  obtenerConfigPeriodo,
  obtenerCierreTrimestral,
  cerrarTrimestre,
  obtenerSaldosBanco,
  guardarSaldosBanco
};
