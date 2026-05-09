const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const subirSustentoPDF = async (req, res) => {
  try {
    // Multer ya procesó el archivo físico y lo dejó en req.file
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se envió ningún archivo o el formato no es PDF.' });
    }

    // Obtenemos los metadatos del formulario
    const { director_id, anio, trimestre } = req.body;

    if (!director_id || !anio || !trimestre) {
      return res.status(400).json({ success: false, message: 'Faltan datos requeridos (director_id, anio, trimestre).' });
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

const eliminarSustento = async (req, res) => {
  try {
    const { id } = req.params;
    const { directorId } = req.query;

    if (!id || !directorId) {
      return res.status(400).json({ success: false, message: 'Faltan parámetros (id, directorId).' });
    }

    // 1. Obtener la ruta del archivo y verificar permisos
    const [rows] = await pool.execute('SELECT ruta_archivo FROM sustentos WHERE id = ? AND director_id = ?', [Number(id), Number(directorId)]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Archivo no encontrado o acceso denegado.' });
    }

    // 2. Eliminar de la base de datos
    await pool.execute('DELETE FROM sustentos WHERE id = ?', [Number(id)]);

    // 3. Eliminar el archivo físico del disco duro (usando path.basename por seguridad)
    const rutaFisica = path.join(__dirname, '..', 'uploads', 'pdfs', path.basename(rows[0].ruta_archivo));
    if (fs.existsSync(rutaFisica)) {
      fs.unlinkSync(rutaFisica);
    }

    res.json({ success: true, message: 'Archivo eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar PDF:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor al eliminar el archivo.' });
  }
};

module.exports = { subirSustentoPDF, obtenerSustentos, eliminarSustento };