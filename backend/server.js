require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const movimientosRoutes = require('./routes/movimientos');
const sustentosRoutes = require('./routes/sustentos');
const datosInstitucionalesRoutes = require('./routes/datosInstitucionales');
const especialistaRoutes = require('./routes/especialistaRoutes');
const notificacionesRoutes = require('./routes/notificacionesRoutes');
const adminRoutes = require('./routes/adminRoutes');
const solicitudesRoutes = require('./routes/solicitudesRoutes');


const app = express();
app.set('trust proxy', 1); // Si estás detrás de un proxy (como Nginx o Heroku), esto es importante para que el rate limiter funcione correctamente con las IPs reales
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middlewares
// 1. Helmet: Seguridad de Cabeceras HTTP
app.use(helmet({
  crossOriginResourcePolicy: false, // Permite que tu frontend cargue los PDFs de /uploads sin ser bloqueado
}));

// 2. Rate Limiting: Protección Anti-Fuerza Bruta
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 peticiones por IP en esa ventana
  message: { success: false, message: 'Demasiados intentos de acceso. Por favor, intente nuevamente en 15 minutos.' }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Servir los archivos PDFs estáticamente para poder descargarlos después
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
// Aplicamos el limitador ÚNICAMENTE a las rutas de autenticación (Login, Recuperar Contraseña)
app.use('/api/auth', authLimiter, authRoutes); 
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/sustentos', sustentosRoutes);
app.use('/api/datos-institucionales', datosInstitucionalesRoutes);
app.use('/api/especialista', especialistaRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/solicitudes-reemplazo', solicitudesRoutes);
app.use('/api/comprobantes', require('./routes/comprobantes'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API UGEL funcionando correctamente ✅' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
