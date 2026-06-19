const express = require('express');
const router = express.Router();
const {
  downloadBackup,
  getAuditoriaLogs,
  getLoginLogs,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getDashboardResumen,
  getPeriodos,
  updatePeriodo,
  getInstituciones,
  updateInstitucion,
  getEspecialistas,
  asignarEspecialista,
  asignacionMasiva,
  quitarEspecialista,
  limpiarAsignacionesEspecialista,
  getProrrogas,
  upsertProrroga,
  getCierreHistorial,
  cambiarCierreAdmin,
  reabrirCierresMasivo,
  resetPasswordAdmin,
  getAvisos,
  getAvisosActivos,
  createAviso,
  toggleAviso,
  getAdminComprobantes,
  createAdminComprobante,
  updateAdminComprobante
} = require('../controllers/adminController');
const { verificarToken } = require('../middlewares/authMiddleware');

const verificarAdmin = (req, res, next) => {
  if (String(req.usuario?.rol || '').toLowerCase() !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acceso restringido para administradores.' });
  }

  return next();
};

router.use(verificarToken);
router.get('/avisos/activos', getAvisosActivos);
router.use(verificarAdmin);

// Ruta GET: /api/admin/backup
// Genera y descarga un archivo .sql con la base de datos completa
router.get('/backup', downloadBackup);

router.get('/login-logs', getLoginLogs); // Nueva ruta para logs de inicio de sesión

// Agrega la ruta GET
router.get('/auditoria', getAuditoriaLogs); // Protégela con tu middleware JWT

router.get('/usuarios', getUsers); // Nueva ruta para obtener usuarios
router.post('/usuarios', createUser); // Nueva ruta para crear un usuario
router.put('/usuarios/:id', updateUser); // Nueva ruta para actualizar un usuario
router.delete('/usuarios/:id', deleteUser); // Nueva ruta para eliminar un usuario
router.post('/usuarios/:id/reset-password', resetPasswordAdmin);

router.get('/resumen', getDashboardResumen);
router.get('/periodos', getPeriodos);
router.put('/periodos', updatePeriodo);
router.post('/cierres', cambiarCierreAdmin);
router.post('/cierres/reabrir-todos', reabrirCierresMasivo);
router.get('/cierres/historial', getCierreHistorial);
router.get('/prorrogas', getProrrogas);
router.put('/prorrogas', upsertProrroga);
router.get('/avisos', getAvisos);
router.post('/avisos', createAviso);
router.put('/avisos/:id', toggleAviso);
router.get('/comprobantes-admin', getAdminComprobantes);
router.post('/comprobantes-admin', createAdminComprobante);
router.put('/comprobantes-admin/:id', updateAdminComprobante);

router.get('/instituciones', getInstituciones);
router.put('/instituciones/:id', updateInstitucion);
router.get('/especialistas', getEspecialistas);
router.post('/asignaciones', asignarEspecialista);
router.post('/asignaciones/masivas', asignacionMasiva);
router.delete('/asignaciones/especialista/:id', limpiarAsignacionesEspecialista);
router.delete('/asignaciones', quitarEspecialista);

module.exports = router;
