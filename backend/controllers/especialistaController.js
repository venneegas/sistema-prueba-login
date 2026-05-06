const { pool } = require('../config/db'); 

const getColegiosPorTrimestre = async (req, res) => {
  try {
    // 1. Recibir los parámetros de trimestre y año (por defecto el actual si no envían)
    const trimestre = req.query.trimestre || 1;
    const anio = req.query.anio || new Date().getFullYear();

    // 2. Consulta SQL usando LEFT JOIN y COALESCE
    const sql = `
      SELECT 
          d.id AS id,
          ie.codigo_modular AS codigoModular,
          ie.numero_ie AS numeroIE,
          ie.nombre_ie AS nombre,
          COALESCE(et.estado, 'Borrador') AS estado
      FROM directores d
      INNER JOIN instituciones_educativas ie ON d.institucion_id = ie.id
      LEFT JOIN estado_trimestres et 
          ON d.id = et.director_id 
          AND et.trimestre = ? 
          AND et.anio = ?
      ORDER BY ie.nombre_ie ASC
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
      FROM ingresos 
      WHERE director_id = ? AND YEAR(fecha) = ? AND MONTH(fecha) BETWEEN ? AND ?
    `;
    
    // 2. Obtener Total de Egresos del trimestre
    const queryEgresos = `
      SELECT COALESCE(SUM(monto), 0) AS total 
      FROM egresos 
      WHERE director_id = ? AND YEAR(fecha) = ? AND MONTH(fecha) BETWEEN ? AND ?
    `;

    // 3. Obtener el Saldo del Banco (el saldo final del mes 3 del trimestre)
    const querySaldos = `
      SELECT saldo_mes3 AS saldo_final 
      FROM saldos_cuenta_corriente 
      WHERE director_id = ? AND anio = ? AND trimestre = ?
    `;

    // Ejecutar las 3 consultas en paralelo para mayor velocidad
    const [ingresosResult, egresosResult, saldosResult] = await Promise.all([
      pool.execute(queryIngresos, [directorId, anio, mesInicio, mesFin]),
      pool.execute(queryEgresos, [directorId, anio, mesInicio, mesFin]),
      pool.execute(querySaldos, [directorId, anio, trimestre])
    ]);

    res.status(200).json({
      success: true,
      totalIngresos: Number(ingresosResult[0][0].total),
      totalEgresos: Number(egresosResult[0][0].total),
      saldoBanco: saldosResult[0].length > 0 ? Number(saldosResult[0][0].saldo_final) : 0
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
      FROM sustentos_pdf 
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
      INSERT INTO estado_trimestres (director_id, trimestre, anio, estado, comentario_observacion, fecha_auditoria)
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
        'DELETE FROM cierres_trimestrales WHERE director_id = ? AND anio = ? AND trimestre = ?',
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

    await connection.commit();
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
        ie.codigo_modular AS codigoModular,
        ie.numero_ie AS numeroIE,
        ie.nombre_ie AS nombre,
        COALESCE(et.estado, 'Borrador') AS estado,
        (SELECT COALESCE(SUM(monto), 0) FROM ingresos i WHERE i.director_id = d.id AND YEAR(fecha) = ? AND MONTH(fecha) BETWEEN ? AND ?) AS totalIngresos,
        (SELECT COALESCE(SUM(monto), 0) FROM egresos e WHERE e.director_id = d.id AND YEAR(fecha) = ? AND MONTH(fecha) BETWEEN ? AND ?) AS totalEgresos,
        (SELECT COALESCE(saldo_mes3, 0) FROM saldos_cuenta_corriente scc WHERE scc.director_id = d.id AND anio = ? AND trimestre = ?) AS saldoFinal
      FROM directores d
      INNER JOIN instituciones_educativas ie ON d.institucion_id = ie.id
      LEFT JOIN estado_trimestres et ON d.id = et.director_id AND et.trimestre = ? AND et.anio = ?
      ORDER BY ie.nombre_ie ASC
    `;

    const [rows] = await pool.execute(sql, [
      anio, mesInicio, mesFin, // Para ingresos
      anio, mesInicio, mesFin, // Para egresos
      anio, trimestre,         // Para saldos
      trimestre, anio          // Para estados
    ]);

    res.status(200).json({ success: true, reporte: rows });
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
