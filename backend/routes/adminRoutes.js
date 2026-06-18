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
  quitarEspecialista,
  cambiarCierreAdmin,
  resetPasswordAdmin
} = require('../controllers/adminController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.use(verificarToken);

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

router.get('/instituciones', getInstituciones);
router.put('/instituciones/:id', updateInstitucion);
router.get('/especialistas', getEspecialistas);
router.post('/asignaciones', asignarEspecialista);
router.delete('/asignaciones', quitarEspecialista);

module.exports = router;
