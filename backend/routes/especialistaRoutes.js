const express = require('express');
const router = express.Router();
const especialistaController = require('../controllers/especialistaController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Middleware de autenticación y roles (Opcional por ahora, pero recomendado)
// const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Ruta GET: /api/especialista/colegios
// Ejemplo de uso: /api/especialista/colegios?trimestre=1&anio=2026
router.get('/colegios', especialistaController.getColegiosPorTrimestre);

// Ruta GET: /api/especialista/colegio/:directorId/finanzas
// Obtiene los totales de ingresos, egresos y saldo bancario
router.get('/colegio/:directorId/finanzas', especialistaController.getResumenFinanciero);

// Ruta GET: /api/especialista/colegio/:directorId/pdfs
// Obtiene la lista de documentos PDF subidos como sustento
router.get('/colegio/:directorId/pdfs', especialistaController.getPdfsPorColegio);

// Ruta POST: /api/especialista/auditar
// Cambia el estado (Aprobar/Observar) y envía notificación
router.post('/auditar', especialistaController.auditarDeclaracion);

router.post('/consolidado/manual', verificarToken, especialistaController.guardarCargaManualConsolidado);

// Ruta GET: /api/especialista/reporte-global
// Trae la tabla cruzada con todos los colegios y sus sumatorias para el Excel
router.get('/reporte-global', especialistaController.getReporteGlobal);

module.exports = router;
