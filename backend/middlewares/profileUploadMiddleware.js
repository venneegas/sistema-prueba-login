const multer = require('multer');
const path = require('path');
const fs = require('fs');

const baseDir = path.join(__dirname, '../uploads/perfiles');
const directorDir = path.join(baseDir, 'directores');
const escudoDir = path.join(baseDir, 'escudos');

[directorDir, escudoDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tipo = req.profileUploadType === 'escudo' ? 'escudos' : 'directores';
    cb(null, path.join(baseDir, tipo));
  },
  filename: (req, file, cb) => {
    const directorId = req.params.directorId || 'director';
    const safePrefix = req.profileUploadType === 'escudo' ? 'escudo' : 'foto';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safePrefix}_${directorId}_${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato invalido. Solo se permiten imagenes JPG, PNG o WEBP.'), false);
  }
};

const uploadPerfilImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const setProfileUploadType = (type) => (req, res, next) => {
  req.profileUploadType = type;
  next();
};

module.exports = {
  uploadPerfilImage,
  setProfileUploadType,
};
