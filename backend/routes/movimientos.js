const express = require('express');
const {
  listarMovimientos,
  guardarMovimientos,
  obtenerConfigPeriodo,
  obtenerCierreTrimestral,
  cerrarTrimestre,
  obtenerSaldosBanco,
  guardarSaldosBanco
} = require('../controllers/movimientosController');

const { verificarToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/cierres/estado', verificarToken, obtenerCierreTrimestral);
router.post('/cierres', verificarToken, cerrarTrimestre);
router.get('/periodos/config', verificarToken, obtenerConfigPeriodo);

router.get('/saldos-banco', verificarToken, obtenerSaldosBanco);
router.post('/saldos-banco', verificarToken, guardarSaldosBanco);

router.get('/:tipo', verificarToken, listarMovimientos);
router.post('/:tipo/replace-range', verificarToken, guardarMovimientos);

module.exports = router;
