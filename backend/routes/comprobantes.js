const express = require('express');
const router = express.Router();
const comprobantesController = require('../controllers/comprobantesController');

router.get('/', comprobantesController.getComprobantes);

module.exports = router;