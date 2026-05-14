const mysql = require('mysql2/promise');

// Configuración de conexión MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'ugel_db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Verificar conexión al iniciar
pool.getConnection()
  .then((conn) => {
    console.log('✅ Conectado a MySQL correctamente');
    conn.release();
  })
  .catch((err) => {
    console.error('❌ Error conectando a MySQL:', err.message);
  });

module.exports = {
  pool,
};
