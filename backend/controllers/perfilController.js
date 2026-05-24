const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const getPerfil = async (req, res) => {
  try {
    const { directorId } = req.params;

    if (!directorId) {
      return res.status(400).json({ success: false, message: 'Falta el directorId.' });
    }

    const [rows] = await pool.execute(
      'SELECT director_id, foto_director, escudo_colegio FROM perfil WHERE director_id = ?',
      [Number(directorId)]
    );

    return res.json({
      success: true,
      data: rows[0] || {
        director_id: Number(directorId),
        foto_director: null,
        escudo_colegio: null,
      },
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return res.status(500).json({ success: false, message: 'Error en el servidor al obtener el perfil.' });
  }
};

const eliminarArchivoAnterior = (rutaRelativa) => {
  if (!rutaRelativa || !rutaRelativa.startsWith('/uploads/perfiles/')) return;

  const rutaFisica = path.join(__dirname, '..', rutaRelativa.replace(/^\/+/, ''));
  if (fs.existsSync(rutaFisica)) {
    fs.unlinkSync(rutaFisica);
  }
};

const uploadPerfilAsset = (columnName, folderName) => async (req, res) => {
  try {
    const { directorId } = req.params;

    if (!directorId) {
      return res.status(400).json({ success: false, message: 'Falta el directorId.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se envio ninguna imagen valida.' });
    }

    const [existingRows] = await pool.execute(
      `SELECT ${columnName} FROM perfil WHERE director_id = ?`,
      [Number(directorId)]
    );

    const rutaImagen = `/uploads/perfiles/${folderName}/${req.file.filename}`;

    await pool.execute(
      `
        INSERT INTO perfil (director_id, ${columnName})
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE ${columnName} = VALUES(${columnName})
      `,
      [Number(directorId), rutaImagen]
    );

    if (existingRows.length > 0) {
      eliminarArchivoAnterior(existingRows[0][columnName]);
    }

    return res.status(201).json({
      success: true,
      message: 'Imagen actualizada correctamente.',
      data: { [columnName]: rutaImagen },
    });
  } catch (error) {
    console.error('Error actualizando imagen de perfil:', error);
    return res.status(500).json({ success: false, message: 'Error en el servidor al guardar la imagen.' });
  }
};

module.exports = {
  getPerfil,
  subirFotoDirector: uploadPerfilAsset('foto_director', 'directores'),
  subirEscudoColegio: uploadPerfilAsset('escudo_colegio', 'escudos'),
};
