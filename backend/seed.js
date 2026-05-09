const { pool } = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runSeeder() {
  try {
    console.log('🌱 Iniciando la siembra de datos (Seeder)...');
    
    // 1. Leer el archivo JSON original
    const dataPath = path.join(__dirname, 'data', 'directores.json');
    const rawData = fs.readFileSync(dataPath);
    const datos = JSON.parse(rawData);
    
    // 2. Aquí extraeríamos los datos
    console.log(`📦 Preparando para insertar ${datos.instituciones.length} colegios.`);
    console.log(`📦 Preparando para insertar ${datos.directores.length} directores.`);
    console.log(`📦 Preparando para insertar ${datos.usuarios.length} usuarios.`);
    
    // 3. Insertar Catálogo de Comprobantes
    console.log('📄 Insertando Tipos de Comprobantes...');
    const comprobantes = ['Factura', 'Boleta Venta', 'Boleta Electrónica', 'Recibo por Honorarios', 'Declaración Jurada', 'Voucher Banco', 'Cheque'];
    for (const comp of comprobantes) {
      await pool.execute(
        `INSERT IGNORE INTO comprobantes (nombre, activo) VALUES (?, 1)`,
        [comp]
      );
    }

    // 4. Insertar Colegios (Instituciones Educativas)
    console.log('🏫 Insertando Instituciones Educativas...');
    for (const ie of datos.instituciones) {
      await pool.execute(
        `INSERT IGNORE INTO instituciones (id, codigo_modular, numero, nombre, nivel_educativo, modalidad, provincia, distrito) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [ie.id, ie.codigo_modular, ie.numero_ie || null, ie.nombre_ie, ie.nivel_educativo, ie.modalidad, ie.provincia, ie.distrito]
      );
    }

    // 5. Insertar Directores
    console.log('👨‍🏫 Insertando Directores...');
    for (const dir of datos.directores) {
      await pool.execute(
        `INSERT IGNORE INTO directores (id, dni, nombres, apellido_paterno, apellido_materno, celular, email, institucion_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [dir.id, dir.dni, dir.nombres, dir.apellido_paterno, dir.apellido_materno, dir.celular, dir.email, dir.institucion_id]
      );
    }

    // 6. Insertar Usuarios
    console.log('🔐 Insertando Usuarios...');
    for (const usr of datos.usuarios) {
      await pool.execute(
        `INSERT IGNORE INTO usuarios (id, email, nombre, password_hash, rol, director_id, estado) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [usr.id, usr.email, usr.nombre || null, usr.password_hash, usr.rol, usr.director_id, usr.estado]
      );
    }
    
    console.log('✅ Base de datos poblada exitosamente.');
    
  } catch (error) {
    console.error('❌ Error ejecutando el seeder:', error);
  } finally {
    // Cerrar la conexión para que el script termine
    pool.end();
    process.exit();
  }
}

runSeeder();
