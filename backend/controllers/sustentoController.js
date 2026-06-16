const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { logAuditoria } = require('../utils/auditLogger');

const ESTADO_BLOQUEO_TRIMESTRE = 423;
let cierreTableReadyPromise = null;

const asegurarTablaCierres = async () => {
  if (!cierreTableReadyPromise) {
    cierreTableReadyPromise = pool.execute(
      `CREATE TABLE IF NOT EXISTS cierres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        director_id INT NOT NULL,
        anio INT NOT NULL,
        trimestre TINYINT NOT NULL,
        cerrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

const eliminarArchivoSubido = (file) => {
  if (!file?.path) return;
  try {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  } catch (error) {
    console.error('No se pudo eliminar el archivo temporal:', error);
  }
};

const trimestreEstaCerrado = async (directorId, anio, trimestre) => {
  await asegurarTablaCierres();

  const [rows] = await pool.execute(
    `SELECT id
     FROM cierres
     WHERE director_id = ? AND anio = ? AND trimestre = ?
     LIMIT 1`,
    [Number(directorId), Number(anio), Number(trimestre)]
  );

  return rows.length > 0;
};

const subirSustentoPDF = async (req, res) => {
  try {
    // Multer ya procesó el archivo físico y lo dejó en req.file
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se envió ningún archivo o el formato no es PDF.' });
    }

    // Obtenemos los metadatos del formulario
    const { director_id, anio, trimestre } = req.body;

    if (!director_id || !anio || !trimestre) {
      eliminarArchivoSubido(req.file);
      return res.status(400).json({ success: false, message: 'Faltan datos requeridos (director_id, anio, trimestre).' });
    }

    if (await trimestreEstaCerrado(director_id, anio, trimestre)) {
      eliminarArchivoSubido(req.file);
      return res.status(ESTADO_BLOQUEO_TRIMESTRE).json({
        success: false,
        message: `El trimestre ${trimestre} del ${anio} ya fue cerrado y no admite nuevos sustentos.`,
      });
    }

    const nombre_original = req.file.originalname;
    const ruta_archivo = `/uploads/pdfs/${req.file.filename}`;
    const tamanio_bytes = req.file.size;

    // Insertar en nuestra nueva tabla sustentos_pdf
    const query = `
      INSERT INTO sustentos (director_id, nombre_original, ruta_archivo, tamanio_bytes, anio, trimestre)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(query, [director_id, nombre_original, ruta_archivo, tamanio_bytes, anio, trimestre]);

    try {
      let currentUserId = req.usuario?.id || req.user?.id;
      if (!currentUserId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'firma_secreta_ugel_2026');
          currentUserId = decoded.id;
        } catch (e) { /* Ignorar error de token */ }
      }

      await logAuditoria({
        usuario_id: currentUserId || 1,
        modulo: 'Documentos',
        accion: 'SUBIR_PDF',
        descripcion: `El director subió el sustento ${nombre_original} para el trimestre ${trimestre} del año ${anio}.`,
        ip_address: req.ip || req.connection?.remoteAddress
      });
    } catch (auditErr) { console.error('Error registrando auditoría:', auditErr); }

    res.status(201).json({
      success: true,
      message: 'Archivo PDF subido y registrado exitosamente.',
      data: { id: result.insertId, nombre_original, ruta_archivo }
    });

  } catch (error) {
    console.error('Error al guardar PDF en base de datos:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor al procesar el archivo.' });
  }
};

const obtenerSustentos = async (req, res) => {
  try {
    const { directorId, anio, trimestreId } = req.query;

    if (!directorId || !anio || !trimestreId) {
      return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos (directorId, anio, trimestreId).' });
    }

    const query = `
      SELECT id, nombre_original, ruta_archivo, tamanio_bytes, subido_en
      FROM sustentos
      WHERE director_id = ? AND anio = ? AND trimestre = ?
      ORDER BY subido_en DESC
    `;
    
    // Nos aseguramos de convertirlos a números para que MySQL no se confunda
    const [rows] = await pool.execute(query, [Number(directorId), Number(anio), Number(trimestreId)]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener PDFs:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor al obtener los archivos.' });
  }
};

const verSustento = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Falta el id del sustento.' });
    }

    const [rows] = await pool.execute(
      'SELECT nombre_original, ruta_archivo FROM sustentos WHERE id = ? LIMIT 1',
      [Number(id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sustento no encontrado.' });
    }

    const rutaFisica = path.join(__dirname, '..', 'uploads', 'pdfs', path.basename(rows[0].ruta_archivo));

    if (!fs.existsSync(rutaFisica)) {
      return res.status(404).send('El archivo PDF no existe en el servidor. Si el sistema fue redesplegado, Render pudo haber limpiado el almacenamiento temporal.');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(rows[0].nombre_original || rows[0].ruta_archivo)}"`);
    return res.sendFile(rutaFisica);
  } catch (error) {
    console.error('Error al servir PDF:', error);
    return res.status(500).json({ success: false, message: 'Error en el servidor al abrir el archivo.' });
  }
};

const eliminarSustento = async (req, res) => {
  try {
    const { id } = req.params;
    const { directorId } = req.query;

    if (!id || !directorId) {
      return res.status(400).json({ success: false, message: 'Faltan parámetros (id, directorId).' });
    }

    // 1. Obtener la ruta del archivo y verificar permisos
    const [rows] = await pool.execute(
      'SELECT ruta_archivo, anio, trimestre FROM sustentos WHERE id = ? AND director_id = ?',
      [Number(id), Number(directorId)]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Archivo no encontrado o acceso denegado.' });
    }

    if (await trimestreEstaCerrado(directorId, rows[0].anio, rows[0].trimestre)) {
      return res.status(ESTADO_BLOQUEO_TRIMESTRE).json({
        success: false,
        message: `El trimestre ${rows[0].trimestre} del ${rows[0].anio} ya fue cerrado y no admite eliminar sustentos.`,
      });
    }

    // 2. Eliminar de la base de datos
    await pool.execute('DELETE FROM sustentos WHERE id = ?', [Number(id)]);

    // 3. Eliminar el archivo físico del disco duro (usando path.basename por seguridad)
    const rutaFisica = path.join(__dirname, '..', 'uploads', 'pdfs', path.basename(rows[0].ruta_archivo));
    if (fs.existsSync(rutaFisica)) {
      fs.unlinkSync(rutaFisica);
    }

    try {
      let currentUserId = req.usuario?.id || req.user?.id;
      if (!currentUserId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'firma_secreta_ugel_2026');
          currentUserId = decoded.id;
        } catch (e) { /* Ignorar error de token */ }
      }

      await logAuditoria({
        usuario_id: currentUserId || 1,
        modulo: 'Documentos',
        accion: 'ELIMINAR_PDF',
        descripcion: `Se eliminó un sustento PDF (ID: ${id}) del director ID: ${directorId}.`,
        ip_address: req.ip || req.connection?.remoteAddress
      });
    } catch (auditErr) { console.error('Error registrando auditoría:', auditErr); }

    res.json({ success: true, message: 'Archivo eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar PDF:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor al eliminar el archivo.' });
  }
};

module.exports = { subirSustentoPDF, obtenerSustentos, verSustento, eliminarSustento };
