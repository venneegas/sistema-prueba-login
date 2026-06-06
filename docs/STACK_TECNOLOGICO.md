# Stack Tecnologico Del Proyecto

**Estado:** vigente  
**Ultima actualizacion:** junio de 2026

El sistema usa una arquitectura web con frontend en React, backend en Node.js/Express y persistencia real en MySQL.

## Frontend

- **React:** interfaz principal basada en componentes funcionales y hooks.
- **JavaScript / JSX:** lenguaje de desarrollo del cliente.
- **Tailwind CSS:** estilos utilitarios, responsive design y modo oscuro.
- **Lucide React:** iconografia de la interfaz.
- **jsPDF + jspdf-autotable:** generacion de reportes PDF.
- **ExcelJS:** generacion de archivos Excel.
- **React Scripts:** build y servidor de desarrollo.

## Backend

- **Node.js:** entorno de ejecucion.
- **Express:** API REST y middleware.
- **mysql2:** conexion a MySQL mediante pool y promesas.
- **bcryptjs:** hash y validacion de contrasenas.
- **jsonwebtoken:** generacion y validacion de tokens JWT.
- **multer:** subida de archivos PDF e imagenes.
- **nodemailer:** recuperacion de contrasena y notificaciones por correo.
- **helmet:** cabeceras HTTP de seguridad.
- **cors:** control de origenes permitidos.
- **express-rate-limit:** limitacion de intentos en rutas sensibles.
- **dotenv:** variables de entorno.

## Base De Datos

- **Motor:** MySQL.
- **Fuente real de datos:** tablas MySQL. No se usa `directores.json` ni datos mock para autenticar usuarios.
- **Tablas clave:** `usuarios`, `roles`, `directores`, `instituciones`, `movimientos`, `saldos`, `sustentos`, `cierres`, `estados`, `tesoreria`, `notificaciones`, `solicitudes`, `sesiones` y `auditorias`.

## Persistencia De Archivos

- Los PDFs subidos por los directores se guardan en `backend/uploads/pdfs`.
- Las rutas y metadatos se registran en `sustentos`.
- En produccion se recomienda usar disco persistente en Render o almacenamiento externo para evitar perdida de archivos en redeploys.

## Desarrollo Y Operacion

- **npm:** gestor de paquetes.
- **nodemon:** reinicio automatico del backend en desarrollo.
- **Vercel:** despliegue del frontend.
- **Render:** despliegue del backend.
- **HeidiSQL / phpMyAdmin:** administracion de MySQL segun el entorno disponible.

## Seguridad

- Las contrasenas se almacenan hasheadas.
- Las rutas privadas usan JWT.
- Los intentos de login se registran en `sesiones`.
- Las acciones sensibles se registran en `auditorias`.
- La API aplica cabeceras de seguridad y rate limit en autenticacion.
