const { pool } = require('../config/db');

// @desc    Obtener los datos institucionales de un director
// @route   GET /api/datos-institucionales/:directorId
const getDatos = async (req, res) => {
  try {
    const { directorId } = req.params;
    
    // Usamos el pool para ejecutar la consulta
    const [rows] = await pool.execute(
      'SELECT * FROM tesoreria WHERE director_id = ?', 
      [directorId]
    );
    
    if (rows.length === 0) {
      return res.json({ success: true, data: null }); // Aún no ha guardado datos
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error obteniendo datos institucionales:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor.' });
  }
};

// @desc    Crear o actualizar los datos institucionales
// @route   POST /api/datos-institucionales/:directorId
const saveDatos = async (req, res) => {
  try {
    const { directorId } = req.params;
    const { nombre_tesorero, dni_tesorero, celular_tesorero, numero_cuenta_corriente, banco } = req.body;

    // --- Validación en el Backend ---
    // Validamos que si se envía un DNI, este tenga 8 dígitos numéricos.
    if (dni_tesorero && (dni_tesorero.length !== 8 || !/^\d{8}$/.test(dni_tesorero))) {
      return res.status(400).json({ success: false, message: 'El DNI del tesorero debe contener exactamente 8 dígitos numéricos.' });
    }
    // Validamos que si se envía un celular, este tenga 9 dígitos numéricos.
    if (celular_tesorero && (celular_tesorero.length !== 9 || !/^\d{9}$/.test(celular_tesorero))) {
      return res.status(400).json({ success: false, message: 'El celular del tesorero debe contener exactamente 9 dígitos numéricos.' });
    }

    // Operación atómica: Insertar o actualizar si el director_id ya existe
    await pool.execute(`
      INSERT INTO tesoreria (director_id, nombre_tesorero, dni_tesorero, celular_tesorero, numero_cuenta_corriente, banco)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        nombre_tesorero = VALUES(nombre_tesorero),
        dni_tesorero = VALUES(dni_tesorero),
        celular_tesorero = VALUES(celular_tesorero),
        numero_cuenta_corriente = VALUES(numero_cuenta_corriente),
        banco = VALUES(banco)
    `, [directorId, nombre_tesorero, dni_tesorero, celular_tesorero, numero_cuenta_corriente, banco || 'Banco de la Nación']);

    res.json({ success: true, message: 'Datos institucionales guardados correctamente.' });
  } catch (error) {
    console.error('Error guardando datos institucionales:', error);
    res.status(500).json({ success: false, message: 'Error al guardar los datos en el servidor.' });
  }
};

module.exports = { getDatos, saveDatos };