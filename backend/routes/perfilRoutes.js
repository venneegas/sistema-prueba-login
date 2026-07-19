const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const { uploadPerfilImage, setProfileUploadType } = require('../middlewares/profileUploadMiddleware');
const { getPerfil, actualizarDatosDirector, subirFotoDirector, subirEscudoColegio } = require('../controllers/perfilController');

router.get('/:directorId', verificarToken, getPerfil);
router.put('/:directorId', verificarToken, actualizarDatosDirector);

router.post(
  '/:directorId/foto',
  verificarToken,
  setProfileUploadType('foto'),
  uploadPerfilImage.single('imagen'),
  subirFotoDirector
);

router.post(
  '/:directorId/escudo',
  verificarToken,
  setProfileUploadType('escudo'),
  uploadPerfilImage.single('imagen'),
  subirEscudoColegio
);

module.exports = router;
