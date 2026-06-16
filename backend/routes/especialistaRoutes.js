const express = require('express');
const router = express.Router();
const especialistaController = require('../controllers/especialistaController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Middleware de autenticación y roles (Opcional por ahora, pero recomendado)
// const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Ruta GET: /api/especialista/colegios
// Ejemplo de uso: /api/especialista/colegios?trimestre=1&anio=2026
router.get('/colegios', verificarToken, especialistaController.getColegiosPorTrimestre);

// Ruta GET: /api/especialista/colegio/:directorId/finanzas
// Obtiene los totales de ingresos, egresos y saldo bancario
router.get('/colegio/:directorId/finanzas', verificarToken, especialistaController.getResumenFinanciero);

// Ruta GET: /api/especialista/colegio/:directorId/pdfs
// Obtiene la lista de documentos PDF subidos como sustento
router.get('/colegio/:directorId/pdfs', verificarToken, especialistaController.getPdfsPorColegio);

// Ruta POST: /api/especialista/auditar
// Cambia el estado (Aprobar/Observar) y envía notificación
router.post('/auditar', verificarToken, especialistaController.auditarDeclaracion);

router.post('/consolidado/manual', verificarToken, especialistaController.guardarCargaManualConsolidado);

router.get('/ml/dataset', verificarToken, especialistaController.getDatasetIsolationForest);
router.get('/ml/isolation-forest', verificarToken, especialistaController.ejecutarAlertasIsolationForest);

// Ruta GET: /api/especialista/reporte-global
// Trae la tabla cruzada con todos los colegios y sus sumatorias para el Excel
router.get('/reporte-global', verificarToken, especialistaController.getReporteGlobal);

module.exports = router;
