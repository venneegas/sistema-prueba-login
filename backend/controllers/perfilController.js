const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { validateDirectorProfileUpdate } = require('../utils/perfilUpdateValidation');

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

const actualizarDatosDirector = async (req, res) => {
  try {
    const { directorId } = req.params;

    if (!directorId) {
      return res.status(400).json({ success: false, message: 'Falta el directorId.' });
    }

    const datosActualizados = validateDirectorProfileUpdate(req.body || {});

    if (Object.keys(datosActualizados).length === 0) {
      return res.status(400).json({ success: false, message: 'No se enviaron datos para actualizar.' });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [directores] = await connection.execute(
        'SELECT id, institucion_id FROM directores WHERE id = ?',
        [Number(directorId)]
      );

      if (directores.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Director no encontrado.' });
      }

      const director = directores[0];
      const camposDirectores = [];
      const valoresDirectores = [];

      if (Object.prototype.hasOwnProperty.call(datosActualizados, 'dni')) {
        camposDirectores.push('dni = ?');
        valoresDirectores.push(datosActualizados.dni);
      }

      if (Object.prototype.hasOwnProperty.call(datosActualizados, 'celular')) {
        camposDirectores.push('celular = ?');
        valoresDirectores.push(datosActualizados.celular);
      }

      if (Object.prototype.hasOwnProperty.call(datosActualizados, 'email')) {
        camposDirectores.push('email = ?');
        valoresDirectores.push(datosActualizados.email);
      }

      if (camposDirectores.length > 0) {
        await connection.execute(
          `UPDATE directores SET ${camposDirectores.join(', ')} WHERE id = ?`,
          [...valoresDirectores, Number(directorId)]
        );
      }

      if (Object.prototype.hasOwnProperty.call(datosActualizados, 'ruc')) {
        await connection.execute(
          'UPDATE instituciones SET ruc = ? WHERE id = ?',
          [datosActualizados.ruc, director.institucion_id]
        );
      }

      if (Object.prototype.hasOwnProperty.call(datosActualizados, 'email')) {
        await connection.execute(
          'UPDATE usuarios SET email = ? WHERE director_id = ?',
          [datosActualizados.email, Number(directorId)]
        );
      }

      await connection.commit();

      return res.json({
        success: true,
        message: 'Datos del director actualizados correctamente.',
        data: {
          dni: datosActualizados.dni,
          celular: datosActualizados.celular,
          email: datosActualizados.email,
          ruc: datosActualizados.ruc,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error actualizando datos del director:', error);
    if (error.message && /DNI|celular|correo|RUC/i.test(error.message)) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Error en el servidor al actualizar los datos del director.' });
  }
};

module.exports = {
  getPerfil,
  actualizarDatosDirector,
  subirFotoDirector: uploadPerfilAsset('foto_director', 'directores'),
  subirEscudoColegio: uploadPerfilAsset('escudo_colegio', 'escudos'),
};
