const { pool } = require('../config/db'); 
const { logAuditoria } = require('../utils/auditLogger');
const nodemailer = require('nodemailer');

const calcularSaldoInicialCaja = async (directorId, trimestreId, anio) => {
  if (anio < 2026) return 0;
  
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
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'mail.ugelsanta.gob.pe',
          port: process.env.EMAIL_PORT || 465,
          secure: process.env.EMAIL_SECURE === 'true' || true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const mailOptions = {
          from: `"Sistema Financiero UGEL" <${process.env.EMAIL_USER}>`,
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
                  Por favor, ingresa a tu panel en el <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #2563eb; text-decoration: none;">Sistema de Gestión Financiera</a> para visualizar más detalles o levantar la observación si es necesario.
                </p>
              </div>
            </div>
          `
        };
        
        // No usamos 'await' para no bloquear la respuesta rápida al Frontend del Especialista
        transporter.sendMail(mailOptions).catch(err => console.error('Error interno de Nodemailer al enviar correo de auditoría:', err));
      } catch (mailErr) {
        console.error('Error configurando Nodemailer:', mailErr);
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

module.exports = {
  getColegiosPorTrimestre,
  getResumenFinanciero,
  getPdfsPorColegio,
  auditarDeclaracion,
  getReporteGlobal
};
