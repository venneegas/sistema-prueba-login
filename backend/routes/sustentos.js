const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { subirSustentoPDF, obtenerSustentos, verSustento, eliminarSustento } = require('../controllers/sustentoController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Endpoint POST para subir el archivo
router.post('/upload', verificarToken, upload.single('archivoPdf'), subirSustentoPDF);

// Endpoint GET para listar los archivos de un trimestre
router.get('/', verificarToken, obtenerSustentos);
router.get('/:id/ver', verSustento);

// Endpoint DELETE para borrar un archivo (base de datos y físico)
router.delete('/:id', verificarToken, eliminarSustento);

module.exports = router;
