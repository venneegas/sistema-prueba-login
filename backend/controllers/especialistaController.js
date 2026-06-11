const { pool } = require('../config/db'); 
const { logAuditoria } = require('../utils/auditLogger');
const { getFrontendUrl, getMailFrom, sendMail } = require('../utils/mailer');

const MANUAL_Q1_EXCEPTION = {
  anio: 2026,
  trimestre: 1,
  cutoff: '2026-06-18',
  movementDates: ['2026-01-31', '2026-02-28', '2026-03-31'],
  conceptPrefix: '[CARGA MANUAL UGEL Q1 2026]',
};

const toMoney = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? Number(numberValue.toFixed(2)) : null;
};

const toMonthlyMoney = (values, fallbackTotal = null) => {
  if (Array.isArray(values)) {
    const monthly = values.slice(0, 3).map((value) => toMoney(value ?? 0));
    if (monthly.length !== 3 || monthly.some((value) => value === null)) return null;
    return monthly;
  }

  const fallback = toMoney(fallbackTotal ?? 0);
  return fallback === null ? null : [0, 0, fallback];
};

const getCurrentUserId = (req) => {
  let currentUserId = req.usuario?.id || req.user?.id;

  if (!currentUserId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'firma_secreta_ugel_2026');
      currentUserId = decoded.id;
    } catch (e) { /* Ignorar error de token aqui */ }
  }

  return currentUserId || 1;
};

const calcularSaldoInicialCaja = async (directorId, trimestreId, anio) => {
  if (anio < 2026) return 0;

  if (anio === 2026 && trimestreId === 1) {
    const [[saldoInicialManual]] = await pool.execute(
      `SELECT COALESCE(saldo_inicial, 0) AS saldo_inicial
       FROM saldos
       WHERE director_id = ? AND anio = ? AND trimestre = ?
       LIMIT 1`,
      [directorId, anio, trimestreId]
    );

    return Number(saldoInicialManual?.saldo_inicial || 0);
  }
  
  const trimestreAnterior = trimestreId === 1 ? 4 : trimestreId - 1;
  const anioAnterior = trimestreId === 1 ? anio - 1 : anio;
  
  if (anioAnterior < 2026) return 0;
  
  const mesInicio = (trimestreAnterior - 1) * 3 + 1;
  const mesFin = trimestreAnterior * 3;

  const [[ingresos]] = await pool.execute(`SELECT COALESCE(SUM(monto), 0) AS total FROM movimientos WHERE director_id = ? AND tipo_movimiento = 'INGRESO' AND YEAR(fecha) = ? AND MONTH(fecha) BETWEEN ? AND ?`, [directorId, anioAnterior, mesInicio, mesFin]);
  const [[egresos]] = await pool.execute(`SELECT COALESCE(SUM(monto), 0) AS total FROM movimientos WHERE director_id = ? AND tipo_movimiento = 'EGRESO' AND YEAR(fecha) = ? AND MONTH(fecha) BETWEEN ? AND ?`, [directorId, anioAnterior, mesInicio, mesFin]);

  const saldoAnterior = await calcularSaldoInicialCaja(directorId, trimestreAnterior, anioAnterior);
  
  return saldoAnterior + Number(ingresos.total) - Number(egresos.total);
};

const getColegiosPorTrimestre = async (req, res) => {
  try {
    // 1. Recibir los parámetros de trimestre y año (por defecto el actual si no envían)
    const trimestre = req.query.trimestre || 1;
    const anio = req.query.anio || new Date().getFullYear();

    // 2. Consulta SQL usando LEFT JOIN y COALESCE
    const sql = `
      SELECT 
          d.id AS id,
          i.codigo_modular AS codigoModular,
          i.numero AS numeroIE,
          i.nombre AS nombre,
          COALESCE(e.estado, 'Borrador') AS estado
      FROM directores d
      INNER JOIN instituciones i ON d.institucion_id = i.id
      LEFT JOIN estados e 
          ON d.id = e.director_id 
          AND e.trimestre = ? 
          AND e.anio = ?
      ORDER BY i.nombre ASC
    `;

    // 3. Ejecutar la consulta pasando los parámetros asegurando que sean números
    const [rows] = await pool.execute(sql, [Number(trimestre), Number(anio)]);

    // 4. Devolver la respuesta exitosa al frontend
    res.status(200).json({
      success: true,
      colegios: rows
    });

  } catch (error) {
    console.error('Error al obtener colegios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al cargar los colegios'
    });
  }
};

const getResumenFinanciero = async (req, res) => {
  try {
    const { directorId } = req.params;
    const trimestre = Number(req.query.trimestre || 1);
    const anio = Number(req.query.anio || new Date().getFullYear());

    // Calcular los meses que abarca el trimestre (ej. Trimestre 1 = Meses 1 al 3)
    const mesInicio = (trimestre - 1) * 3 + 1;
    const mesFin = trimestre * 3;

    // 1. Obtener Total de Ingresos del trimestre
    const queryIngresos = `
      SELECT COALESCE(SUM(monto), 0) AS total 
      FROM movimientos 
      WHERE director_id = ? AND tipo_movimiento = 'INGRESO' AND YEAR(fecha) = ? AND MONTH(fecha) BETWEEN ? AND ?
    `;
    
    // 2. Obtener Total de Egresos del trimestre
    const queryEgresos = `
      SELECT COALESCE(SUM(monto), 0) AS total 
      FROM movimientos 
      WHERE director_id = ? AND tipo_movimiento = 'EGRESO' AND YEAR(fecha) = ? AND MONTH(fecha) BETWEEN ? AND ?
    `;

    // 3. Obtener el Saldo del Banco (el saldo final del mes 3 del trimestre)
    const querySaldos = `
      SELECT saldo_mes3 AS saldo_final 
      FROM saldos 
      WHERE director_id = ? AND anio = ? AND trimestre = ?
    `;

    const saldoInicialCaja = await calcularSaldoInicialCaja(directorId, trimestre, anio);

    // Ejecutar las 3 consultas en paralelo para mayor velocidad
    const [ingresosResult, egresosResult, saldosResult] = await Promise.all([
      pool.execute(queryIngresos, [directorId, anio, mesInicio, mesFin]),
      pool.execute(queryEgresos, [directorId, anio, mesInicio, mesFin]),
      pool.execute(querySaldos, [directorId, anio, trimestre])
    ]);

    const ingresosTrimestre = Number(ingresosResult[0][0].total);
    const egresosTrimestre = Number(egresosResult[0][0].total);
    const saldoBanco = saldosResult[0].length > 0 ? Number(saldosResult[0][0].saldo_final) : 0;
    const dineroEnCaja = saldoInicialCaja + ingresosTrimestre - egresosTrimestre;

    res.status(200).json({
      success: true,
      totalIngresos: ingresosTrimestre,
      totalEgresos: egresosTrimestre,
      dineroEnCaja: dineroEnCaja,
      dineroEnBanco: saldoBanco,
      saldoTotal: dineroEnCaja + saldoBanco
    });

  } catch (error) {
    console.error('Error al obtener resumen financiero:', error);
    res.status(500).json({ success: false, message: 'Error interno al calcular los totales financieros' });
  }
};

const getPdfsPorColegio = async (req, res) => {
  try {
    const { directorId } = req.params;
    const trimestre = Number(req.query.trimestre || 1);
    const anio = Number(req.query.anio || new Date().getFullYear());

    const sql = `
      SELECT id, nombre_original, ruta_archivo, tamanio_bytes, subido_en 
      FROM sustentos 
      WHERE director_id = ? AND anio = ? AND trimestre = ?
      ORDER BY subido_en DESC
    `;
    
    const [rows] = await pool.execute(sql, [directorId, anio, trimestre]);

    res.status(200).json({ success: true, pdfs: rows });
  } catch (error) {
    console.error('Error al obtener PDFs:', error);
    res.status(500).json({ success: false, message: 'Error interno al cargar los documentos' });
  }
};

const guardarCargaManualConsolidado = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      directorId,
      trimestre,
      anio,
      totalIngresos,
      totalEgresos,
      saldoBancoFinal,
      ingresosMensuales,
      egresosMensuales,
      saldosBancoMensuales,
      saldoInicialCaja,
      observacion,
    } = req.body;

    const periodoAnio = Number(anio);
    const periodoTrimestre = Number(trimestre);
    const ingresos = toMonthlyMoney(ingresosMensuales, totalIngresos);
    const egresos = toMonthlyMoney(egresosMensuales, totalEgresos);
    const saldosBanco = toMonthlyMoney(saldosBancoMensuales, saldoBancoFinal);
    const saldoInicialManual = toMoney(saldoInicialCaja ?? 0);
    const totalIngresosCalculado = ingresos?.reduce((sum, value) => sum + value, 0) || 0;
    const totalEgresosCalculado = egresos?.reduce((sum, value) => sum + value, 0) || 0;
    const saldoBancoFinalCalculado = saldosBanco?.[2] || 0;
    const motivo = String(observacion || '').trim();
    const hoy = new Date();
    const limite = new Date(`${MANUAL_Q1_EXCEPTION.cutoff}T23:59:59-05:00`);

    if (!directorId || !periodoAnio || !periodoTrimestre) {
      return res.status(400).json({ success: false, message: 'directorId, anio y trimestre son obligatorios.' });
    }

    if (periodoAnio !== MANUAL_Q1_EXCEPTION.anio || periodoTrimestre !== MANUAL_Q1_EXCEPTION.trimestre) {
      return res.status(400).json({
        success: false,
        message: 'La carga manual excepcional solo esta habilitada para el 1er trimestre 2026.',
      });
    }

    if (hoy > limite) {
      return res.status(423).json({
        success: false,
        message: 'La carga manual excepcional vencio el 18/06/2026.',
      });
    }

    if (!ingresos || !egresos || !saldosBanco || saldoInicialManual === null) {
      return res.status(400).json({
        success: false,
        message: 'Los montos mensuales deben ser numericos y no negativos.',
      });
    }

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'Registra un motivo para dejar trazabilidad de la excepcion.',
      });
    }

    await connection.beginTransaction();

    const [[directorInfo]] = await connection.execute(
      `SELECT d.id, i.nombre AS institucion, i.numero AS numero_ie
       FROM directores d
       INNER JOIN instituciones i ON d.institucion_id = i.id
       WHERE d.id = ?
       LIMIT 1`,
      [directorId]
    );

    if (!directorInfo) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'No se encontro el colegio/director seleccionado.' });
    }

    await connection.execute(
      'INSERT IGNORE INTO comprobantes (nombre, activo) VALUES (?, 1)',
      ['Ajuste Manual UGEL']
    );

    const [[comprobante]] = await connection.execute(
      'SELECT id FROM comprobantes WHERE nombre = ? LIMIT 1',
      ['Ajuste Manual UGEL']
    );

    await connection.execute(
      `DELETE FROM movimientos
       WHERE director_id = ?
         AND fecha BETWEEN '2026-01-01' AND '2026-03-31'
         AND concepto LIKE ?`,
      [directorId, `${MANUAL_Q1_EXCEPTION.conceptPrefix}%`]
    );

    const movimientos = [];
    ingresos.forEach((monto, index) => {
      if (monto <= 0) return;
      movimientos.push([
        directorId,
        'INGRESO',
        MANUAL_Q1_EXCEPTION.movementDates[index],
        comprobante.id,
        'UGEL',
        `MAN-Q1-${directorId}-ING-${index + 1}`,
        `${MANUAL_Q1_EXCEPTION.conceptPrefix} Ingresos mes ${index + 1}. Motivo: ${motivo}`.substring(0, 255),
        monto,
        '#2563eb',
      ]);
    });

    egresos.forEach((monto, index) => {
      if (monto <= 0) return;
      movimientos.push([
        directorId,
        'EGRESO',
        MANUAL_Q1_EXCEPTION.movementDates[index],
        comprobante.id,
        'UGEL',
        `MAN-Q1-${directorId}-EGR-${index + 1}`,
        `${MANUAL_Q1_EXCEPTION.conceptPrefix} Egresos mes ${index + 1}. Motivo: ${motivo}`.substring(0, 255),
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
      [directorId, periodoAnio, periodoTrimestre, saldoInicialManual, saldosBanco[0], saldosBanco[1], saldosBanco[2]]
    );

    await connection.execute(
      `INSERT IGNORE INTO cierres (director_id, anio, trimestre)
       VALUES (?, ?, ?)`,
      [directorId, periodoAnio, periodoTrimestre]
    );

    await connection.execute(
      `INSERT INTO estados (director_id, trimestre, anio, estado, fecha_envio)
       VALUES (?, ?, ?, 'Enviado', NOW())
       ON DUPLICATE KEY UPDATE
         estado = IF(estado = 'Borrador', 'Enviado', estado),
         fecha_envio = COALESCE(fecha_envio, NOW())`,
      [directorId, periodoTrimestre, periodoAnio]
    );

    await connection.commit();

    await logAuditoria({
      usuario_id: getCurrentUserId(req),
      modulo: 'Consolidado',
      accion: 'ACTUALIZAR',
      descripcion: `Carga manual mensual Q1 2026 hasta 18/06 para ${directorInfo.numero_ie ? `IE ${directorInfo.numero_ie} - ` : ''}${directorInfo.institucion}. Inicial caja: S/ ${saldoInicialManual.toFixed(2)}, Ing: S/ ${totalIngresosCalculado.toFixed(2)}, Egr: S/ ${totalEgresosCalculado.toFixed(2)}, Banco final: S/ ${saldoBancoFinalCalculado.toFixed(2)}.`.substring(0, 255),
      ip_address: req.ip || req.connection?.remoteAddress
    });

    return res.status(200).json({
      success: true,
      message: 'Carga manual registrada en el consolidado y auditada correctamente.',
      data: {
        ingresosMensuales: ingresos,
        egresosMensuales: egresos,
        saldosBancoMensuales: saldosBanco,
        saldoInicialCaja: saldoInicialManual,
        totalIngresos: totalIngresosCalculado,
        totalEgresos: totalEgresosCalculado,
        dineroEnBanco: saldoBancoFinalCalculado,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error en carga manual del consolidado:', error);
    return res.status(500).json({ success: false, message: 'Error interno al registrar la carga manual.' });
  } finally {
    connection.release();
  }
};

const auditarDeclaracion = async (req, res) => {
  // Solicitamos una conexión dedicada para hacer una transacción segura
  const connection = await pool.getConnection();
  try {
    const { directorId, trimestre, anio, estado, comentario } = req.body;

    if (!directorId || !trimestre || !anio || !estado) {
      return res.status(400).json({ success: false, message: 'Faltan datos obligatorios para auditar.' });
    }

    await connection.beginTransaction();

    // 1. Actualizar o Insertar el estado del trimestre
    const queryEstado = `
      INSERT INTO estados (director_id, trimestre, anio, estado, comentario_observacion, fecha_auditoria)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
      estado = VALUES(estado), 
      comentario_observacion = VALUES(comentario_observacion), 
      fecha_auditoria = NOW()
    `;
    await connection.execute(queryEstado, [directorId, trimestre, anio, estado, comentario || null]);

    // 2. Configurar la Notificación según la decisión
    let titulo = '';
    let mensaje = '';
    let tipo = 'info';

    if (estado === 'Observado') {
      titulo = `Atención: Observación en el Trimestre ${trimestre}`;
      mensaje = `Tu declaración financiera ha sido revisada y tiene observaciones: "${comentario}". Por favor, corrige los datos o adjunta los documentos faltantes y vuelve a enviar.`;
      tipo = 'error'; // Rojo en el frontend

      // DESBLOQUEAR SISTEMA: Eliminamos el candado para que el director pueda editar de nuevo
      await connection.execute(
        'DELETE FROM cierres WHERE director_id = ? AND anio = ? AND trimestre = ?',
        [directorId, anio, trimestre]
      );
    } else if (estado === 'Aprobado') {
      titulo = `¡Informe Aprobado! (Trimestre ${trimestre})`;
      mensaje = `Tu declaración financiera ha sido revisada y aprobada satisfactoriamente por la UGEL.`;
      tipo = 'exito'; // Verde en el frontend
    }

    // 3. Insertar la Notificación para el director
    const queryNotif = `INSERT INTO notificaciones (director_id, titulo, mensaje, tipo) VALUES (?, ?, ?, ?)`;
    await connection.execute(queryNotif, [directorId, titulo, mensaje, tipo]);

    // 3.5 Obtener datos del director para el correo electrónico
    const [[directorData]] = await connection.execute(
      'SELECT email, nombres, apellido_paterno FROM directores WHERE id = ?', 
      [directorId]
    );

    // 4. Registrar auditoría de la evaluación
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
        modulo: 'Auditoría',
        accion: `EVAL_${estado.toUpperCase()}`,
        descripcion: `El Especialista evaluó el trimestre ${trimestre} del año ${anio} de la I.E. (Director ID: ${directorId}) con estado: ${estado}`,
        ip_address: req.ip || req.connection?.remoteAddress
      });
    } catch (auditErr) { console.error('Error en logAuditoria:', auditErr); }

    await connection.commit();

    // 5. ENVIAR CORREO CON NODEMAILER (En segundo plano)
    if (directorData && directorData.email) {
      try {
        const mailOptions = {
          from: getMailFrom('Sistema Financiero UGEL'),
          to: directorData.email,
          subject: titulo,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background-color: ${estado === 'Aprobado' ? '#10b981' : '#f43f5e'}; padding: 20px; text-align: center;">
                <h2 style="color: white; margin: 0;">${titulo}</h2>
              </div>
              <div style="padding: 20px; color: #334155;">
                <p>Hola <strong>${directorData.nombres} ${directorData.apellido_paterno}</strong>,</p>
                <p>${mensaje}</p>
                <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
                  Por favor, ingresa a tu panel en el <a href="${getFrontendUrl()}" style="color: #2563eb; text-decoration: none;">Sistema de Gestión Financiera</a> para visualizar más detalles o levantar la observación si es necesario.
                </p>
              </div>
            </div>
          `
        };
        
        // No usamos 'await' para no bloquear la respuesta rápida al Frontend del Especialista
        sendMail(mailOptions).catch(err => console.error('Error interno al enviar correo de auditoría:', err));
      } catch (mailErr) {
        console.error('Error preparando correo de auditoría:', mailErr);
      }
    }

    res.status(200).json({ success: true, message: 'Auditoría registrada y notificada con éxito.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error en auditoría:', error);
    res.status(500).json({ success: false, message: 'Error interno al procesar la auditoría.' });
  } finally {
    connection.release();
  }
};

const getReporteGlobal = async (req, res) => {
  try {
    const trimestre = Number(req.query.trimestre || 1);
    const anio = Number(req.query.anio || new Date().getFullYear());
    
    const mesInicio = (trimestre - 1) * 3 + 1;
    const mesFin = trimestre * 3;

    // Esta poderosa consulta trae la lista de colegios + sus estados + la suma total de su dinero
    const sql = `
      SELECT 
        d.id AS directorId,
        i.codigo_modular AS codigoModular,
        i.numero AS numeroIE,
        i.nombre AS nombre,
        t.numero_cuenta_corriente AS numeroCuentaCorriente,
        COALESCE(t.banco, 'Banco de la Nación') AS banco,
        COALESCE(e.estado, 'Borrador') AS estado,
        (SELECT COALESCE(SUM(monto), 0) FROM movimientos m1 WHERE m1.director_id = d.id AND m1.tipo_movimiento = 'INGRESO' AND YEAR(m1.fecha) = ? AND MONTH(m1.fecha) BETWEEN ? AND ?) AS totalIngresos,
        (SELECT COALESCE(SUM(monto), 0) FROM movimientos m2 WHERE m2.director_id = d.id AND m2.tipo_movimiento = 'EGRESO' AND YEAR(m2.fecha) = ? AND MONTH(m2.fecha) BETWEEN ? AND ?) AS totalEgresos,
        (SELECT COALESCE(saldo_mes3, 0) FROM saldos s WHERE s.director_id = d.id AND anio = ? AND trimestre = ?) AS saldoFinal
      FROM directores d
      INNER JOIN instituciones i ON d.institucion_id = i.id
      LEFT JOIN tesoreria t ON d.id = t.director_id
      LEFT JOIN estados e ON d.id = e.director_id AND e.trimestre = ? AND e.anio = ?
      ORDER BY i.nombre ASC
    `;

    const [rows] = await pool.execute(sql, [
      anio, mesInicio, mesFin, // Para ingresos
      anio, mesInicio, mesFin, // Para egresos
      anio, trimestre,         // Para saldos
      trimestre, anio          // Para estados
    ]);

    // Procesar saldo inicial de caja y consolidar datos para cada colegio
    const reporteProcesado = await Promise.all(rows.map(async (row) => {
      const saldoInicialCaja = await calcularSaldoInicialCaja(row.directorId, trimestre, anio);
      const ingresos = Number(row.totalIngresos);
      const egresos = Number(row.totalEgresos);
      const dineroEnBanco = Number(row.saldoFinal);
      const dineroEnCaja = saldoInicialCaja + ingresos - egresos;

      return {
        ...row,
        totalIngresos: ingresos,
        totalEgresos: egresos,
        dineroEnCaja: dineroEnCaja,
        dineroEnBanco: dineroEnBanco,
        saldoTotal: dineroEnCaja + dineroEnBanco
      };
    }));

    res.status(200).json({ success: true, reporte: reporteProcesado });
  } catch (error) {
    console.error('Error al generar reporte global:', error);
    res.status(500).json({ success: false, message: 'Error interno al generar los datos del reporte.' });
  }
};

const getDatasetIsolationForest = async (req, res) => {
  try {
    const trimestre = Number(req.query.trimestre || 1);
    const anio = Number(req.query.anio || new Date().getFullYear());

    if (!Number.isInteger(trimestre) || trimestre < 1 || trimestre > 4 || !Number.isInteger(anio)) {
      return res.status(400).json({
        success: false,
        message: 'anio y trimestre deben ser valores validos.',
      });
    }

    const mesInicio = (trimestre - 1) * 3 + 1;
    const meses = [mesInicio, mesInicio + 1, mesInicio + 2];

    const sql = `
      SELECT
        d.id AS director_id,
        i.codigo_modular,
        i.numero AS numero_ie,
        i.nombre AS institucion,
        COALESCE(e.estado, 'Borrador') AS estado,
        COALESCE(s.saldo_inicial, 0) AS saldo_inicial,
        COALESCE(s.saldo_mes1, 0) AS saldo_banco_mes1,
        COALESCE(s.saldo_mes2, 0) AS saldo_banco_mes2,
        COALESCE(s.saldo_mes3, 0) AS saldo_banco_mes3,
        SUM(CASE WHEN m.tipo_movimiento = 'INGRESO' AND MONTH(m.fecha) = ? THEN m.monto ELSE 0 END) AS ingresos_mes1,
        SUM(CASE WHEN m.tipo_movimiento = 'INGRESO' AND MONTH(m.fecha) = ? THEN m.monto ELSE 0 END) AS ingresos_mes2,
        SUM(CASE WHEN m.tipo_movimiento = 'INGRESO' AND MONTH(m.fecha) = ? THEN m.monto ELSE 0 END) AS ingresos_mes3,
        SUM(CASE WHEN m.tipo_movimiento = 'EGRESO' AND MONTH(m.fecha) = ? THEN m.monto ELSE 0 END) AS egresos_mes1,
        SUM(CASE WHEN m.tipo_movimiento = 'EGRESO' AND MONTH(m.fecha) = ? THEN m.monto ELSE 0 END) AS egresos_mes2,
        SUM(CASE WHEN m.tipo_movimiento = 'EGRESO' AND MONTH(m.fecha) = ? THEN m.monto ELSE 0 END) AS egresos_mes3,
        COUNT(CASE WHEN m.concepto LIKE ? THEN 1 END) AS registros_manual,
        COUNT(m.id) AS total_movimientos
      FROM directores d
      INNER JOIN instituciones i ON d.institucion_id = i.id
      LEFT JOIN estados e ON e.director_id = d.id AND e.anio = ? AND e.trimestre = ?
      LEFT JOIN saldos s ON s.director_id = d.id AND s.anio = ? AND s.trimestre = ?
      LEFT JOIN movimientos m
        ON m.director_id = d.id
       AND YEAR(m.fecha) = ?
       AND MONTH(m.fecha) BETWEEN ? AND ?
      GROUP BY
        d.id,
        i.codigo_modular,
        i.numero,
        i.nombre,
        e.estado,
        s.saldo_inicial,
        s.saldo_mes1,
        s.saldo_mes2,
        s.saldo_mes3
      ORDER BY i.nombre ASC
    `;

    const [rows] = await pool.execute(sql, [
      meses[0], meses[1], meses[2],
      meses[0], meses[1], meses[2],
      `${MANUAL_Q1_EXCEPTION.conceptPrefix}%`,
      anio, trimestre,
      anio, trimestre,
      anio, mesInicio, mesInicio + 2,
    ]);

    const dataset = await Promise.all(rows.map(async (row) => {
      const saldoInicialCaja = await calcularSaldoInicialCaja(row.director_id, trimestre, anio);
      const ingresosMes1 = Number(row.ingresos_mes1 || 0);
      const ingresosMes2 = Number(row.ingresos_mes2 || 0);
      const ingresosMes3 = Number(row.ingresos_mes3 || 0);
      const egresosMes1 = Number(row.egresos_mes1 || 0);
      const egresosMes2 = Number(row.egresos_mes2 || 0);
      const egresosMes3 = Number(row.egresos_mes3 || 0);
      const totalIngresos = ingresosMes1 + ingresosMes2 + ingresosMes3;
      const totalEgresos = egresosMes1 + egresosMes2 + egresosMes3;
      const dineroEnCaja = saldoInicialCaja + totalIngresos - totalEgresos;
      const saldoBancoMes1 = Number(row.saldo_banco_mes1 || 0);
      const saldoBancoMes2 = Number(row.saldo_banco_mes2 || 0);
      const saldoBancoMes3 = Number(row.saldo_banco_mes3 || 0);
      const saldoFinal = dineroEnCaja + saldoBancoMes3;
      const tieneMovimientos = Number(row.total_movimientos || 0) > 0;
      const tieneSaldosBanco = saldoBancoMes1 > 0 || saldoBancoMes2 > 0 || saldoBancoMes3 > 0;
      const estadoValido = ['Enviado', 'Aprobado', 'Observado'].includes(row.estado);

      return {
        director_id: row.director_id,
        codigo_modular: row.codigo_modular,
        numero_ie: row.numero_ie,
        institucion: row.institucion,
        anio,
        trimestre,
        saldo_inicial: Number(saldoInicialCaja.toFixed(2)),
        ingresos_mes1: Number(ingresosMes1.toFixed(2)),
        ingresos_mes2: Number(ingresosMes2.toFixed(2)),
        ingresos_mes3: Number(ingresosMes3.toFixed(2)),
        total_ingresos: Number(totalIngresos.toFixed(2)),
        egresos_mes1: Number(egresosMes1.toFixed(2)),
        egresos_mes2: Number(egresosMes2.toFixed(2)),
        egresos_mes3: Number(egresosMes3.toFixed(2)),
        total_egresos: Number(totalEgresos.toFixed(2)),
        dinero_en_caja: Number(dineroEnCaja.toFixed(2)),
        saldo_banco_mes1: Number(saldoBancoMes1.toFixed(2)),
        saldo_banco_mes2: Number(saldoBancoMes2.toFixed(2)),
        saldo_banco_mes3: Number(saldoBancoMes3.toFixed(2)),
        dinero_en_banco: Number(saldoBancoMes3.toFixed(2)),
        saldo_final: Number(saldoFinal.toFixed(2)),
        ratio_egresos_ingresos: totalIngresos > 0 ? Number((totalEgresos / totalIngresos).toFixed(4)) : 0,
        ratio_banco_saldo_final: saldoFinal > 0 ? Number((saldoBancoMes3 / saldoFinal).toFixed(4)) : 0,
        estado: row.estado,
        carga_manual: Number(row.registros_manual || 0) > 0,
        dataset_completo: tieneMovimientos && tieneSaldosBanco && estadoValido,
      };
    }));

    const completos = dataset.filter((row) => row.dataset_completo).length;

    return res.status(200).json({
      success: true,
      meta: {
        anio,
        trimestre,
        total_filas: dataset.length,
        filas_completas: completos,
        filas_incompletas: dataset.length - completos,
        listo_para_entrenamiento: completos >= 10 && completos === dataset.length,
      },
      dataset,
    });
  } catch (error) {
    console.error('Error generando dataset para Isolation Forest:', error);
    return res.status(500).json({ success: false, message: 'Error interno al generar el dataset.' });
  }
};

module.exports = {
  getColegiosPorTrimestre,
  getResumenFinanciero,
  getPdfsPorColegio,
  guardarCargaManualConsolidado,
  auditarDeclaracion,
  getReporteGlobal,
  getDatasetIsolationForest
};
