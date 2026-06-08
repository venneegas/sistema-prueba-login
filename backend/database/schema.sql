-- ============================================
-- UGEL: Schema SQL limpio para MySQL
-- Sistema de Gestion Financiera Educativa
-- Estructura actualizada desde el backup 2026-05-05
-- ============================================

-- CREATE DATABASE IF NOT EXISTS ugel_db;
-- USE ugel_db;

-- ============================================
-- TABLA 1: instituciones
-- ============================================
CREATE TABLE IF NOT EXISTS instituciones (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  codigo_modular     VARCHAR(20) NOT NULL COMMENT 'Codigo MINEDU unico',
  ruc                VARCHAR(11) DEFAULT NULL COMMENT 'RUC de la institucion educativa si corresponde',
  numero             VARCHAR(20) DEFAULT NULL COMMENT 'Numero oficial de la institucion educativa',
  nombre             VARCHAR(200) NOT NULL COMMENT 'Nombre completo de la institucion',
  nivel_educativo    ENUM('inicial', 'primaria', 'secundaria', 'tecnico', 'superior') NOT NULL,
  modalidad          ENUM('regular', 'especial', 'alternativa') NOT NULL,
  provincia          VARCHAR(100) NOT NULL,
  distrito           VARCHAR(100) NOT NULL,
  creado_en          TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en     TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_instituciones_codigo_modular (codigo_modular),
  KEY idx_codigo_modular (codigo_modular),
  KEY idx_provincia_distrito (provincia, distrito)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tabla de instituciones educativas';

-- ============================================
-- TABLA 2: directores
-- ============================================
CREATE TABLE IF NOT EXISTS directores (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  dni                VARCHAR(8) NOT NULL COMMENT 'DNI peruano (8 digitos)',
  nombres            VARCHAR(100) NOT NULL,
  apellido_paterno   VARCHAR(100) NOT NULL,
  apellido_materno   VARCHAR(100) DEFAULT NULL,
  celular            VARCHAR(20) DEFAULT NULL,
  email              VARCHAR(150) NOT NULL,
  institucion_id     INT NOT NULL COMMENT 'Institucion donde es director',
  creado_en          TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en     TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_directores_dni (dni),
  UNIQUE KEY uk_directores_email (email),
  KEY idx_dni (dni),
  KEY idx_email (email),
  KEY idx_institucion (institucion_id),
  CONSTRAINT fk_directores_institucion
    FOREIGN KEY (institucion_id)
    REFERENCES instituciones(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tabla de directores de instituciones educativas';

-- ============================================
-- TABLA 3: roles
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(50) NOT NULL UNIQUE COMMENT 'Nombre del rol (ej: director, especialista, admin)',
  descripcion VARCHAR(255) DEFAULT NULL COMMENT 'Descripcion breve de los permisos del rol',
  creado_en   TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tabla catalogo de roles del sistema';

-- Insertar roles por defecto obligatorios
INSERT IGNORE INTO roles (id, nombre, descripcion) VALUES
(1, 'director', 'Director de una institucion educativa'),
(2, 'especialista', 'Especialista de la UGEL, audita colegios'),
(3, 'admin', 'Administrador del sistema con acceso total');

-- ============================================
-- TABLA 4: usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  email                   VARCHAR(150) NOT NULL COMMENT 'Email para login',
  nombre                  VARCHAR(100) DEFAULT NULL COMMENT 'Nombre visible para admins y especialistas',
  password_hash           VARCHAR(255) NOT NULL COMMENT 'Contrasena hasheada con bcrypt',
  debe_cambiar_password   BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Obliga al usuario a cambiar su clave en el primer ingreso',
  rol_id                  INT NOT NULL DEFAULT 1 COMMENT 'FK a la tabla roles (1=director)',
  director_id             INT DEFAULT NULL COMMENT 'FK opcional: si es director, referencia a tabla directores',
  estado                  ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
  ultimo_login            TIMESTAMP NULL DEFAULT NULL COMMENT 'Ultima fecha/hora de login',
  creado_en               TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en          TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  reset_code              VARCHAR(6) DEFAULT NULL COMMENT 'Codigo temporal para recuperacion de password',
  reset_expires           DATETIME DEFAULT NULL COMMENT 'Fecha de expiracion del codigo temporal',

  UNIQUE KEY uk_usuarios_email (email),
  UNIQUE KEY uk_usuarios_director_id (director_id),
  KEY idx_email (email),
  KEY idx_rol_id (rol_id),
  KEY idx_estado (estado),
  KEY idx_director_id (director_id),
  KEY idx_debe_cambiar_password (debe_cambiar_password),
  CONSTRAINT fk_usuarios_director
    FOREIGN KEY (director_id)
    REFERENCES directores(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_usuarios_rol
    FOREIGN KEY (rol_id)
    REFERENCES roles(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tabla de usuarios para autenticacion en el sistema';

-- ============================================
-- TABLA 4: sesiones
-- ============================================
CREATE TABLE IF NOT EXISTS sesiones (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id         INT DEFAULT NULL COMMENT 'FK a usuarios si el login fue exitoso',
  email              VARCHAR(150) NOT NULL COMMENT 'Email intentado',
  fecha_hora         TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  exitoso            BOOLEAN DEFAULT FALSE,
  razon_fallo        VARCHAR(255) DEFAULT NULL COMMENT 'Motivo del fallo',
  ip_address         VARCHAR(45) DEFAULT NULL COMMENT 'Direccion IP del cliente',
  user_agent         VARCHAR(500) DEFAULT NULL COMMENT 'Navegador o cliente usado',

  KEY idx_fecha_hora (fecha_hora),
  KEY idx_usuario_id (usuario_id),
  KEY idx_email (email),
  KEY idx_exitoso (exitoso),
  CONSTRAINT fk_sesiones_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registro de intentos de inicio de sesion';

-- ============================================
-- TABLA 5: auditorias
-- ============================================
CREATE TABLE IF NOT EXISTS auditorias (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id         INT NOT NULL COMMENT 'Usuario que realizo la accion',
  modulo             VARCHAR(50) NOT NULL COMMENT 'Modulo afectado',
  accion             ENUM('CREAR', 'ACTUALIZAR', 'ELIMINAR', 'CAMBIAR_PASSWORD', 'DESCARGAR') NOT NULL,
  descripcion        VARCHAR(255) NOT NULL COMMENT 'Descripcion de la accion',
  fecha_hora         TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address         VARCHAR(45) DEFAULT NULL COMMENT 'Direccion IP desde donde se hizo',

  KEY idx_auditorias_usuario (usuario_id),
  KEY idx_auditorias_fecha (fecha_hora),
  KEY idx_auditorias_modulo (modulo),
  KEY idx_auditorias_accion (accion),
  CONSTRAINT fk_auditorias_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registro de auditoria de actividades de usuarios';

-- ============================================
-- TABLA 6: comprobantes
-- ============================================
CREATE TABLE IF NOT EXISTS comprobantes (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  nombre             VARCHAR(100) NOT NULL COMMENT 'Ej: Factura, Boleta, Recibo por Honorarios',
  activo             BOOLEAN DEFAULT TRUE COMMENT 'Permite deshabilitar comprobantes antiguos',

  UNIQUE KEY uk_comprobantes_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Catalogo maestro de documentos permitidos';

-- ============================================
-- TABLA 7: movimientos
-- ============================================
CREATE TABLE IF NOT EXISTS movimientos (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  director_id        INT NOT NULL COMMENT 'FK al director responsable del registro',
  tipo_movimiento    ENUM('INGRESO', 'EGRESO') NOT NULL,
  fecha              DATE NOT NULL,
  comprobante_id     INT NOT NULL COMMENT 'FK al catalogo de comprobantes',
  serie              VARCHAR(20) DEFAULT NULL COMMENT 'Serie del comprobante para egresos',
  numero_comprobante VARCHAR(100) NOT NULL,
  concepto           VARCHAR(255) NOT NULL,
  monto              DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  color              VARCHAR(20) DEFAULT NULL COMMENT 'Color hexadecimal para resaltar la fila',
  creado_en          TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en     TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY idx_movimientos_director_id (director_id),
  KEY idx_movimientos_fecha (fecha),
  KEY idx_movimientos_tipo (tipo_movimiento),
  KEY idx_movimientos_director_fecha (director_id, fecha),
  CONSTRAINT fk_movimientos_director
    FOREIGN KEY (director_id)
    REFERENCES directores(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_movimientos_comprobante
    FOREIGN KEY (comprobante_id)
    REFERENCES comprobantes(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Libro mayor: Ingresos y Egresos unificados';

-- ============================================
-- TABLA 8: cierres
-- ============================================
CREATE TABLE IF NOT EXISTS cierres (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  director_id        INT NOT NULL,
  anio               INT NOT NULL,
  trimestre          TINYINT NOT NULL,
  cerrado_en         TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_cierres_trimestre (director_id, anio, trimestre),
  KEY idx_cierres_director (director_id, anio, trimestre),
  CONSTRAINT fk_cierres_director
    FOREIGN KEY (director_id)
    REFERENCES directores(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_cierres_trimestre
    CHECK (trimestre BETWEEN 1 AND 4)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Cierres trimestrales para reportes y analisis';

-- ============================================
-- TABLA 9: estados
-- ============================================
CREATE TABLE IF NOT EXISTS estados (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  director_id            INT NOT NULL,
  trimestre              INT NOT NULL,
  anio                   INT NOT NULL,
  estado                 ENUM('Borrador', 'Enviado', 'Observado', 'Aprobado') DEFAULT 'Borrador',
  comentario_observacion TEXT DEFAULT NULL,
  fecha_envio            DATETIME DEFAULT NULL,
  fecha_auditoria        DATETIME DEFAULT NULL,
  fecha_actualizacion    TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_trimestre_director (director_id, trimestre, anio),
  KEY idx_estados_director (director_id),
  CONSTRAINT fk_estados_director
    FOREIGN KEY (director_id)
    REFERENCES directores(id)
    ON DELETE CASCADE,
  CONSTRAINT chk_estados_trimestre
    CHECK (trimestre IN (1, 2, 3, 4))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Estado del flujo de revision trimestral';

-- ============================================
-- TABLA 10: sustentos
-- ============================================
CREATE TABLE IF NOT EXISTS sustentos (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  director_id        INT NOT NULL COMMENT 'FK al director que subio el archivo',
  nombre_original    VARCHAR(255) NOT NULL COMMENT 'Nombre del archivo original',
  ruta_archivo       VARCHAR(500) NOT NULL COMMENT 'Ruta fisica en el servidor',
  tamanio_bytes      INT DEFAULT NULL COMMENT 'Tamano del archivo en bytes',
  anio               INT NOT NULL,
  trimestre          TINYINT DEFAULT NULL,
  subido_en          TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

  KEY idx_sustentos_director (director_id),
  KEY idx_sustentos_anio_trimestre (anio, trimestre),
  CONSTRAINT fk_sustentos_director
    FOREIGN KEY (director_id)
    REFERENCES directores(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Metadatos de PDFs subidos por directores';

-- ============================================
-- TABLA 11: tesoreria
-- ============================================
CREATE TABLE IF NOT EXISTS tesoreria (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  director_id             INT NOT NULL COMMENT 'FK al director responsable',
  nombre_tesorero         VARCHAR(100) DEFAULT NULL,
  dni_tesorero            VARCHAR(8) DEFAULT NULL,
  celular_tesorero        VARCHAR(9) DEFAULT NULL,
  numero_cuenta_corriente VARCHAR(50) DEFAULT NULL,
  banco                   VARCHAR(50) DEFAULT 'Banco de la Nación',
  fecha_actualizacion     TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY idx_tesoreria_director_id (director_id),
  CONSTRAINT fk_tesoreria_director
    FOREIGN KEY (director_id)
    REFERENCES directores(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Datos adicionales de la institucion y comite';

-- ============================================
-- TABLA 12: perfil
-- ============================================
CREATE TABLE IF NOT EXISTS perfil (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  director_id     INT NOT NULL COMMENT 'FK al director propietario del perfil',
  foto_director   VARCHAR(500) DEFAULT NULL COMMENT 'Ruta publica de la foto del director',
  escudo_colegio  VARCHAR(500) DEFAULT NULL COMMENT 'Ruta publica del escudo de la institucion',
  creado_en       TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_perfil_director (director_id),
  CONSTRAINT fk_perfil_director
    FOREIGN KEY (director_id)
    REFERENCES directores(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Imagenes y datos visuales del perfil del director';

-- ============================================
-- TABLA 13: saldos
-- ============================================
CREATE TABLE IF NOT EXISTS saldos (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  director_id        INT NOT NULL COMMENT 'FK al director logueado',
  anio               INT NOT NULL COMMENT 'Ano del reporte',
  trimestre          TINYINT NOT NULL COMMENT 'Trimestre (1, 2, 3 o 4)',
  saldo_inicial      DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Saldo inicial en cuenta corriente',
  saldo_mes1         DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Saldo al terminar el primer mes',
  saldo_mes2         DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Saldo al terminar el segundo mes',
  saldo_mes3         DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Saldo al terminar el tercer mes',
  creado_en          TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en     TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_saldos_trimestre (director_id, anio, trimestre),
  KEY idx_saldos_director (director_id, anio, trimestre),
  CONSTRAINT fk_saldos_director
    FOREIGN KEY (director_id)
    REFERENCES directores(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_saldos_trimestre
    CHECK (trimestre BETWEEN 1 AND 4)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Saldos mensuales de la cuenta corriente por trimestre';

-- ============================================
-- TABLA 14: notificaciones
-- ============================================
CREATE TABLE IF NOT EXISTS notificaciones (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  director_id        INT NOT NULL,
  titulo             VARCHAR(150) NOT NULL,
  mensaje            TEXT NOT NULL,
  tipo               ENUM('info', 'exito', 'alerta', 'error') DEFAULT 'info',
  leida              BOOLEAN DEFAULT FALSE,
  fecha_creacion     TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

  KEY idx_notificaciones_director_id (director_id),
  CONSTRAINT fk_notificaciones_director
    FOREIGN KEY (director_id)
    REFERENCES directores(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Notificaciones visibles para directores';

-- ============================================
-- TABLA 15: solicitudes
-- ============================================
CREATE TABLE IF NOT EXISTS solicitudes (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  director_id        INT NOT NULL,
  escuela            VARCHAR(255) NOT NULL,
  motivo             TEXT NOT NULL,
  nuevo_correo       VARCHAR(255) NOT NULL,
  telefono           VARCHAR(20) NOT NULL,
  estado             ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
  fecha_creacion     TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

  KEY idx_solicitudes_director_id (director_id),
  KEY idx_solicitudes_estado (estado),
  CONSTRAINT fk_solicitudes_director
    FOREIGN KEY (director_id)
    REFERENCES directores(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Solicitudes de cambio o reemplazo de director';
