-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: ugel_db
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auditoria_logs`
--

DROP TABLE IF EXISTS `auditoria_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL COMMENT 'Usuario que realizó la acción',
  `modulo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ej: Sustentos, Ingresos, Perfil, Admin',
  `accion` enum('CREAR','ACTUALIZAR','ELIMINAR','CAMBIAR_PASSWORD','DESCARGAR') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ej: Subió el archivo Reporte_1.pdf',
  `fecha_hora` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Dirección IP desde donde se hizo',
  PRIMARY KEY (`id`),
  KEY `idx_auditoria_usuario` (`usuario_id`),
  KEY `idx_auditoria_fecha` (`fecha_hora`),
  KEY `idx_auditoria_modulo` (`modulo`),
  KEY `idx_auditoria_accion` (`accion`),
  CONSTRAINT `fk_auditoria_logs_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro de auditoría de actividades de usuarios';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria_logs`
--

LOCK TABLES `auditoria_logs` WRITE;
/*!40000 ALTER TABLE `auditoria_logs` DISABLE KEYS */;
INSERT INTO `auditoria_logs` VALUES (2,1,'Sustentos PDF','DESCARGAR','Visualizó/Descargó el archivo Caso-Practico-Implementacion.pdf','2026-04-26 04:47:28','::1'),(3,1,'Administración','DESCARGAR','El administrador generó y descargó un Backup de la BD (backup_ugel_db_2026-04-26T17-17-16.sql)','2026-04-26 17:17:17','::1'),(4,1,'Administración','DESCARGAR','El administrador generó y descargó un Backup de la BD (backup_ugel_db_2026-05-05T21-48-40.sql)','2026-05-05 21:48:41','::1');
/*!40000 ALTER TABLE `auditoria_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cierres_trimestrales`
--

DROP TABLE IF EXISTS `cierres_trimestrales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cierres_trimestrales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `director_id` int NOT NULL,
  `anio` int NOT NULL,
  `trimestre` tinyint NOT NULL,
  `cerrado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cierre_trimestre` (`director_id`,`anio`,`trimestre`),
  KEY `idx_cierres_trimestrales_director` (`director_id`,`anio`,`trimestre`),
  CONSTRAINT `fk_cierres_trimestrales_director` FOREIGN KEY (`director_id`) REFERENCES `directores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cierres trimestrales para reportes y análisis';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cierres_trimestrales`
--

LOCK TABLES `cierres_trimestrales` WRITE;
/*!40000 ALTER TABLE `cierres_trimestrales` DISABLE KEYS */;
/*!40000 ALTER TABLE `cierres_trimestrales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `datos_institucionales`
--

DROP TABLE IF EXISTS `datos_institucionales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `datos_institucionales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `director_id` int NOT NULL COMMENT 'FK al director responsable',
  `nombre_tesorero` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dni_tesorero` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `celular_tesorero` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_cuenta_corriente` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `banco` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Banco de la Nación',
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_datos_inst_director_id` (`director_id`),
  CONSTRAINT `fk_datos_inst_director` FOREIGN KEY (`director_id`) REFERENCES `directores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Datos adicionales de la institución y comité';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `datos_institucionales`
--

LOCK TABLES `datos_institucionales` WRITE;
/*!40000 ALTER TABLE `datos_institucionales` DISABLE KEYS */;
/*!40000 ALTER TABLE `datos_institucionales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directores`
--

DROP TABLE IF EXISTS `directores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dni` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'DNI peruano (8 dígitos)',
  `nombres` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido_paterno` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido_materno` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `celular` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `institucion_id` int NOT NULL COMMENT 'Institución donde es director',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dni` (`dni`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_dni` (`dni`),
  KEY `idx_email` (`email`),
  KEY `idx_institucion` (`institucion_id`),
  CONSTRAINT `fk_directores_institucion` FOREIGN KEY (`institucion_id`) REFERENCES `instituciones_educativas` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de directores de instituciones educativas';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directores`
--

LOCK TABLES `directores` WRITE;
/*!40000 ALTER TABLE `directores` DISABLE KEYS */;
INSERT INTO `directores` VALUES (1,'32970728','SARAI REBECA','BERNABE','MAGUIÑA','949833586','sariber19@hotmail.com',1,'2026-04-05 17:01:59','2026-04-05 17:01:59'),(2,'87654321','EDEFIR CUSTODIO','VIERA','LOPEZ','938107374','custodioviera1967@hotmail.com',2,'2026-04-05 17:01:59','2026-04-05 17:01:59'),(3,'00000000','HAYDEE','SANCHEZ','PORTAL de TAPIA','966854853','',3,'2026-04-05 17:01:59','2026-04-05 17:01:59'),(4,'32908230','ROSALBINA LIDIA','RODRIGUEZ','LUNA','943810871','yedadero@hotmail.com',4,'2026-04-05 17:01:59','2026-04-05 17:01:59'),(5,'22222222','CAROLINA VIRGINIA','ROSPIGLIOSI','LEYVA','944661493','carolinarospigliosi@hotmail.com',5,'2026-04-05 17:01:59','2026-04-05 17:01:59'),(6,'10126811','DARIA REINA','SANCHEZ','CHAVEZ','949377272','daryexpaxmo@hotmail.com',6,'2026-04-05 17:01:59','2026-04-05 17:01:59');
/*!40000 ALTER TABLE `directores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `egresos`
--

DROP TABLE IF EXISTS `egresos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `egresos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `director_id` int NOT NULL COMMENT 'FK al director responsable del registro',
  `fecha` date NOT NULL,
  `tipo_comprobante` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_comprobante` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `concepto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `monto` decimal(12,2) NOT NULL DEFAULT '0.00',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_egresos_director_id` (`director_id`),
  KEY `idx_egresos_fecha` (`fecha`),
  KEY `idx_egresos_director_fecha` (`director_id`,`fecha`),
  CONSTRAINT `fk_egresos_director` FOREIGN KEY (`director_id`) REFERENCES `directores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Egresos registrados por directores';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `egresos`
--

LOCK TABLES `egresos` WRITE;
/*!40000 ALTER TABLE `egresos` DISABLE KEYS */;
INSERT INTO `egresos` VALUES (1,6,'2026-01-10','BOLETA','001','ESTO ES UNA PRUEBA DE EGRESO BOLETA',100.00,'2026-04-06 03:37:48','2026-04-06 03:37:48'),(9,1,'2026-02-19','Boleta','001','Esto es un egreso',500.00,'2026-04-19 22:53:54','2026-04-19 22:53:54'),(10,1,'2026-01-17','Factura','011','ESTO ES UNA PRUEBA 2',440.00,'2026-04-19 22:56:46','2026-04-19 22:56:46'),(11,1,'2026-01-20','Boleta','012','ESTO ES UNA PRUEBA',55.00,'2026-04-19 22:56:46','2026-04-19 22:56:46'),(13,1,'2026-03-21','Factura','167','Esto es un concepto de Marzo',500.00,'2026-04-22 04:58:49','2026-04-22 04:58:49'),(21,1,'2026-04-23','Boleta','qwe','pago para el mall',2.30,'2026-05-05 23:03:48','2026-05-05 23:03:48');
/*!40000 ALTER TABLE `egresos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estado_trimestres`
--

DROP TABLE IF EXISTS `estado_trimestres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estado_trimestres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `director_id` int NOT NULL,
  `trimestre` int NOT NULL,
  `anio` int NOT NULL,
  `estado` enum('Borrador','Enviado','Observado','Aprobado') DEFAULT 'Borrador',
  `comentario_observacion` text,
  `fecha_envio` datetime DEFAULT NULL,
  `fecha_auditoria` datetime DEFAULT NULL,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_trimestre_director` (`director_id`,`trimestre`,`anio`),
  CONSTRAINT `estado_trimestres_ibfk_1` FOREIGN KEY (`director_id`) REFERENCES `directores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `estado_trimestres_chk_1` CHECK ((`trimestre` in (1,2,3,4)))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estado_trimestres`
--

LOCK TABLES `estado_trimestres` WRITE;
/*!40000 ALTER TABLE `estado_trimestres` DISABLE KEYS */;
/*!40000 ALTER TABLE `estado_trimestres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ingresos`
--

DROP TABLE IF EXISTS `ingresos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingresos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `director_id` int NOT NULL COMMENT 'FK al director responsable del registro',
  `fecha` date NOT NULL,
  `tipo_comprobante` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_comprobante` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `concepto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `monto` decimal(12,2) NOT NULL DEFAULT '0.00',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ingresos_director_id` (`director_id`),
  KEY `idx_ingresos_fecha` (`fecha`),
  KEY `idx_ingresos_director_fecha` (`director_id`,`fecha`),
  CONSTRAINT `fk_ingresos_director` FOREIGN KEY (`director_id`) REFERENCES `directores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=142 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ingresos registrados por directores';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingresos`
--

LOCK TABLES `ingresos` WRITE;
/*!40000 ALTER TABLE `ingresos` DISABLE KEYS */;
INSERT INTO `ingresos` VALUES (5,4,'2026-01-20','FACTURA','001','ESTO ES UNA PRUEBA DE FACTURA',10.00,'2026-04-06 01:43:14','2026-04-06 01:43:14'),(8,1,'2026-02-02','Boleta','001','ESTO ES UNA PRUEBA DE BOLETA',60.00,'2026-04-19 22:55:23','2026-04-19 22:55:23'),(9,1,'2026-02-10','Factura','005','ESTO ES UNA PRUEBA DE FACTURA',80.00,'2026-04-19 22:55:23','2026-04-19 22:55:23'),(10,1,'2026-03-19','Factura','100','prueba',1000.00,'2026-04-19 22:55:39','2026-04-19 22:55:39'),(17,1,'2026-01-10','Factura','010','ESTO ES UNA PRUEBA DE FACTURA',100.00,'2026-04-22 04:55:45','2026-04-22 04:55:45'),(18,1,'2026-01-19','Factura','011','Esto es una factura de colegio xyx',300.00,'2026-04-22 04:55:45','2026-04-22 04:55:45'),(21,1,'2026-04-14','Cheque','011','ESTO ES UNA PRUEBA DE CHEQUE',85.00,'2026-05-05 22:21:11','2026-05-05 22:21:11');
/*!40000 ALTER TABLE `ingresos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `instituciones_educativas`
--

DROP TABLE IF EXISTS `instituciones_educativas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `instituciones_educativas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo_modular` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Código MINEDU único',
  `numero_ie` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre_ie` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre completo de la institución',
  `nivel_educativo` enum('inicial','primaria','secundaria','técnico','superior') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modalidad` enum('regular','especial','alternativa') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `provincia` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `distrito` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_modular` (`codigo_modular`),
  KEY `idx_codigo_modular` (`codigo_modular`),
  KEY `idx_provincia_distrito` (`provincia`,`distrito`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de instituciones educativas';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `instituciones_educativas`
--

LOCK TABLES `instituciones_educativas` WRITE;
/*!40000 ALTER TABLE `instituciones_educativas` DISABLE KEYS */;
INSERT INTO `instituciones_educativas` VALUES (1,'0359323',NULL,'FE Y ALEGRIA 42','primaria','especial','SANTA','CHIMBOTE','2026-04-05 17:01:59','2026-04-05 17:01:59'),(2,'0495234',NULL,'FE Y ALEGRIA 14','secundaria','regular','SANTA','CHIMBOTE','2026-04-05 17:01:59','2026-04-05 17:01:59'),(3,'0577098',NULL,'FE Y ALEGRIA 16','secundaria','regular','SANTA','CHIMBOTE','2026-04-05 17:01:59','2026-04-05 17:01:59'),(4,'0686600','88227','PEDRO PABLO ATUSPARIA','secundaria','regular','SANTA','NUEVO CHIMBOTE','2026-04-05 17:01:59','2026-05-06 21:35:56'),(5,'0359356',NULL,'INMACULADA DE LA MERCED','secundaria','regular','SANTA','CHIMBOTE','2026-04-05 17:01:59','2026-04-05 17:01:59'),(6,'0570226','01','CHIMBOTE','primaria','especial','SANTA','CHIMBOTE','2026-04-05 17:01:59','2026-05-06 21:35:56');
/*!40000 ALTER TABLE `instituciones_educativas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_logs`
--

DROP TABLE IF EXISTS `login_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL COMMENT 'FK a tabla usuarios (si login fue exitoso)',
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Email intentado',
  `fecha_hora` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `exitoso` tinyint(1) DEFAULT '0',
  `razon_fallo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Motivo del fallo (contraseña incorrecta, usuario no existe, etc)',
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Dirección IP del cliente',
  `user_agent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Navegador/cliente usado',
  PRIMARY KEY (`id`),
  KEY `idx_fecha_hora` (`fecha_hora`),
  KEY `idx_usuario_id` (`usuario_id`),
  KEY `idx_email` (`email`),
  KEY `idx_exitoso` (`exitoso`),
  CONSTRAINT `fk_login_logs_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Auditoría de logins - histórico de accesos';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_logs`
--

LOCK TABLES `login_logs` WRITE;
/*!40000 ALTER TABLE `login_logs` DISABLE KEYS */;
INSERT INTO `login_logs` VALUES (1,8,'admin1007@admin.com','2026-04-26 15:19:40',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(2,7,'especialista@ugel.edu.pe','2026-04-26 15:35:44',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(3,8,'admin1007@admin.com','2026-04-26 15:35:55',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(4,8,'edu.venegas@ugel.edu.pe','2026-04-26 16:22:59',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(5,1,'sariber19@hotmail.com','2026-04-26 16:23:32',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(6,9,'brayan.leyva@ugel.edu.pe','2026-04-26 16:25:51',0,'Contraseña incorrecta','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(7,9,'brayan.leyva@ugel.edu.pe','2026-04-26 16:26:26',0,'Contraseña incorrecta','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(8,9,'brayan.leyva@ugel.edu.pe','2026-04-26 16:26:32',0,'Contraseña incorrecta','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(9,9,'brayan.leyva@ugel.edu.pe','2026-04-26 16:27:16',0,'Contraseña incorrecta','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(10,9,'brayan.leyva@ugel.edu.pe','2026-04-26 16:27:17',0,'Contraseña incorrecta','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(11,9,'brayan.leyva@ugel.edu.pe','2026-04-26 16:27:17',0,'Contraseña incorrecta','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(12,9,'brayan.leyva@ugel.edu.pe','2026-04-26 16:27:18',0,'Contraseña incorrecta','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(13,9,'brayan.leyva@ugel.edu.pe','2026-04-26 16:27:18',0,'Contraseña incorrecta','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(14,9,'brayan.leyva@ugel.edu.pe','2026-04-26 16:27:18',0,'Contraseña incorrecta','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(15,9,'brayan.leyva@ugel.edu.pe','2026-04-26 16:29:17',0,'Contraseña incorrecta','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(16,9,'brayan.leyva@ugel.edu.pe','2026-04-26 16:29:42',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(17,1,'sariber19@hotmail.com','2026-05-01 00:58:13',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(18,1,'sariber19@hotmail.com','2026-05-02 04:35:08',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(19,7,'especialista@ugel.edu.pe','2026-05-02 23:13:31',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(20,1,'sariber19@hotmail.com','2026-05-02 23:23:00',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(21,7,'especialista@ugel.edu.pe','2026-05-02 23:23:57',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(22,1,'sariber19@hotmail.com','2026-05-02 23:32:00',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(23,7,'especialista@ugel.edu.pe','2026-05-02 23:32:39',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(24,1,'sariber19@hotmail.com','2026-05-02 23:33:28',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(25,8,'edu.venegas@ugel.edu.pe','2026-05-05 04:46:47',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0'),(26,1,'sariber19@hotmail.com','2026-05-05 14:16:17',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),(27,NULL,'especialista@hotmail.com','2026-05-05 14:20:28',0,'Usuario no encontrado','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),(28,7,'especialista@ugel.edu.pe','2026-05-05 14:20:44',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),(29,7,'especialista@ugel.edu.pe','2026-05-05 20:28:07',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),(30,1,'sariber19@hotmail.com','2026-05-05 20:33:46',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),(31,7,'especialista@ugel.edu.pe','2026-05-05 21:11:05',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),(32,7,'especialista@ugel.edu.pe','2026-05-05 21:48:08',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),(33,8,'edu.venegas@ugel.edu.pe','2026-05-05 21:48:24',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),(34,1,'sariber19@hotmail.com','2026-05-05 21:50:55',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),(35,1,'sariber19@hotmail.com','2026-05-06 15:05:21',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),(36,7,'especialista@ugel.edu.pe','2026-05-06 15:40:03',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),(37,1,'sariber19@hotmail.com','2026-05-06 21:49:18',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),(38,2,'custodioviera1967@hotmail.com','2026-05-06 21:52:44',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),(39,4,'yedadero@hotmail.com','2026-05-06 21:54:16',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),(40,7,'especialista@ugel.edu.pe','2026-05-06 21:55:09',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),(41,8,'edu.venegas@ugel.edu.pe','2026-05-06 21:56:27',1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36');
/*!40000 ALTER TABLE `login_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `director_id` int NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `mensaje` text NOT NULL,
  `tipo` enum('info','exito','alerta','error') DEFAULT 'info',
  `leida` tinyint(1) DEFAULT '0',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `director_id` (`director_id`),
  CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`director_id`) REFERENCES `directores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
INSERT INTO `notificaciones` VALUES (4,1,'Atención: Observación en el Trimestre 1','Tu declaración financiera ha sido revisada y tiene observaciones: \"Corregir todo oeokoe\". Por favor, corrige los datos o adjunta los documentos faltantes y vuelve a enviar.','error',1,'2026-04-25 16:32:57');
/*!40000 ALTER TABLE `notificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saldos_cuenta_corriente`
--

DROP TABLE IF EXISTS `saldos_cuenta_corriente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saldos_cuenta_corriente` (
  `id` int NOT NULL AUTO_INCREMENT,
  `director_id` int NOT NULL COMMENT 'FK al director logueado',
  `anio` int NOT NULL COMMENT 'Año del reporte (ej. 2026)',
  `trimestre` tinyint NOT NULL COMMENT 'Trimestre (1, 2, 3 o 4)',
  `saldo_inicial` decimal(12,2) DEFAULT '0.00' COMMENT 'Saldo inicial en CTA. CTE.',
  `saldo_mes1` decimal(12,2) DEFAULT '0.00' COMMENT 'Saldo al terminar el 1er mes',
  `saldo_mes2` decimal(12,2) DEFAULT '0.00' COMMENT 'Saldo al terminar el 2do mes',
  `saldo_mes3` decimal(12,2) DEFAULT '0.00' COMMENT 'Saldo al terminar el 3er mes (Pasa a Consolidado)',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_saldos_banco_trimestre` (`director_id`,`anio`,`trimestre`),
  CONSTRAINT `fk_saldos_banco_director` FOREIGN KEY (`director_id`) REFERENCES `directores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Saldos mensuales de la cuenta corriente por trimestre';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saldos_cuenta_corriente`
--

LOCK TABLES `saldos_cuenta_corriente` WRITE;
/*!40000 ALTER TABLE `saldos_cuenta_corriente` DISABLE KEYS */;
INSERT INTO `saldos_cuenta_corriente` VALUES (2,1,2026,1,2079.70,5268.30,7724.10,2948.50,'2026-04-19 23:11:39','2026-04-19 23:11:39'),(3,1,2026,3,0.00,68193.02,70619.92,69836.72,'2026-05-05 23:05:30','2026-05-05 23:05:30');
/*!40000 ALTER TABLE `saldos_cuenta_corriente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudes_reemplazo`
--

DROP TABLE IF EXISTS `solicitudes_reemplazo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes_reemplazo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `director_id` int NOT NULL,
  `escuela` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `motivo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `nuevo_correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `estado` enum('pendiente','aprobado','rechazado') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT 'pendiente',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes_reemplazo`
--

LOCK TABLES `solicitudes_reemplazo` WRITE;
/*!40000 ALTER TABLE `solicitudes_reemplazo` DISABLE KEYS */;
INSERT INTO `solicitudes_reemplazo` VALUES (1,1,'FE Y ALEGRIA 42','Se fue :(((','ed.venegas2005@gmail.com','987654321','rechazado','2026-05-02 23:32:31');
/*!40000 ALTER TABLE `solicitudes_reemplazo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sustentos_pdf`
--

DROP TABLE IF EXISTS `sustentos_pdf`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sustentos_pdf` (
  `id` int NOT NULL AUTO_INCREMENT,
  `director_id` int NOT NULL COMMENT 'FK al director que subió el archivo',
  `nombre_original` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ej: Reporte_Marzo.pdf',
  `ruta_archivo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ruta física en el servidor',
  `tamanio_bytes` int DEFAULT NULL COMMENT 'Tamaño del archivo en bytes',
  `anio` int NOT NULL,
  `trimestre` tinyint DEFAULT NULL,
  `subido_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sustentos_director` (`director_id`),
  KEY `idx_sustentos_anio_trimestre` (`anio`,`trimestre`),
  CONSTRAINT `fk_sustentos_director` FOREIGN KEY (`director_id`) REFERENCES `directores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Metadatos de los PDFs de sustento subidos por directores';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sustentos_pdf`
--

LOCK TABLES `sustentos_pdf` WRITE;
/*!40000 ALTER TABLE `sustentos_pdf` DISABLE KEYS */;
INSERT INTO `sustentos_pdf` VALUES (5,1,'Caso-Practico-Implementacion.pdf','/uploads/pdfs/1777128915828-36368192.pdf',2699330,2026,1,'2026-04-25 14:55:15');
/*!40000 ALTER TABLE `sustentos_pdf` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Email para login',
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Contraseña hasheada con bcrypt',
  `debe_cambiar_password` tinyint(1) NOT NULL DEFAULT '1',
  `rol` enum('director','especialista','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'director',
  `director_id` int DEFAULT NULL COMMENT 'FK opcional: si es director, referencia a tabla directores',
  `estado` enum('activo','inactivo','suspendido') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'activo',
  `ultimo_login` timestamp NULL DEFAULT NULL COMMENT 'Últimas fecha/hora de login',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reset_code` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `director_id` (`director_id`),
  KEY `idx_email` (`email`),
  KEY `idx_rol` (`rol`),
  KEY `idx_estado` (`estado`),
  KEY `idx_director_id` (`director_id`),
  KEY `idx_debe_cambiar_password` (`debe_cambiar_password`),
  CONSTRAINT `fk_usuarios_director` FOREIGN KEY (`director_id`) REFERENCES `directores` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de usuarios para autenticación en el sistema';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'sariber19@hotmail.com',NULL,'$2a$10$rio.F9w0kSQJHcbfKTcI5uyV0BS6wfa1gdTTjkCqmEg5zH/vbfS2K',0,'director',1,'activo','2026-05-06 21:49:18','2026-04-05 17:01:59','2026-05-06 21:49:18',NULL,NULL),(2,'custodioviera1967@hotmail.com',NULL,'$2a$10$NwNGk3V/1zm9Vz1h5i32zus84vBOD86hEEbsTmI0Yb5ETCyfZ3/k.',0,'director',2,'activo','2026-05-06 21:52:44','2026-04-05 17:01:59','2026-05-06 21:53:36',NULL,NULL),(3,'',NULL,'$2a$10$zTCEUvETr2o2ug6B0W1DQen7h/WD18BPCdQz36TyVy7q7nHrp2Wci',1,'director',3,'activo',NULL,'2026-04-05 17:01:59','2026-04-05 17:28:34',NULL,NULL),(4,'yedadero@hotmail.com',NULL,'$2a$10$NotvYoI.vOwAY3yV9WgK2.81u8EENKHB5eJRPr3ujaFgoT4vj/wvi',0,'director',4,'activo','2026-05-06 21:54:16','2026-04-05 17:01:59','2026-05-06 21:54:56',NULL,NULL),(5,'carolinarospigliosi@hotmail.com',NULL,'$2a$10$zTCEUvETr2o2ug6B0W1DQen7h/WD18BPCdQz36TyVy7q7nHrp2Wci',1,'director',5,'activo',NULL,'2026-04-05 17:01:59','2026-04-05 17:28:34',NULL,NULL),(6,'daryexpaxmo@hotmail.com',NULL,'$2a$10$zTCEUvETr2o2ug6B0W1DQen7h/WD18BPCdQz36TyVy7q7nHrp2Wci',1,'director',6,'activo',NULL,'2026-04-05 17:01:59','2026-04-05 17:28:34',NULL,NULL),(7,'especialista@ugel.edu.pe','William M. Benites Pimentel','$2a$10$zTCEUvETr2o2ug6B0W1DQen7h/WD18BPCdQz36TyVy7q7nHrp2Wci',0,'especialista',NULL,'activo','2026-05-06 21:55:09','2026-04-05 17:01:59','2026-05-06 21:55:09',NULL,NULL),(8,'edu.venegas@ugel.edu.pe','Edgard Venegas','$2a$10$zTCEUvETr2o2ug6B0W1DQen7h/WD18BPCdQz36TyVy7q7nHrp2Wci',0,'admin',NULL,'activo','2026-05-06 21:56:27','2026-04-25 17:46:28','2026-05-06 21:56:27',NULL,NULL),(9,'brayan.leyva@ugel.edu.pe','Brayan Leyva','$2a$10$zTCEUvETr2o2ug6B0W1DQen7h/WD18BPCdQz36TyVy7q7nHrp2Wci',1,'admin',NULL,'activo','2026-04-26 16:29:42','2026-04-26 16:13:42','2026-04-26 16:29:42',NULL,NULL);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-06 16:56:39
