# Arquitectura del Sistema UGEL

**Estado:** vigente  
**Ultima actualizacion:** junio de 2026

Este documento resume la arquitectura actual del Sistema de Gestion Financiera Educativa. La plataforma trabaja con datos reales almacenados en MySQL; ya no usa archivos JSON ni datos mock como fuente de autenticacion o consulta.

## Vista General

```text
Usuario
  |
  v
Frontend React
  |
  | HTTP/JSON + token JWT
  v
Backend Node.js + Express
  |
  v
Base de datos MySQL
```

## Capas Del Sistema

### Frontend

El frontend esta construido con React y Tailwind CSS. Consume la API del backend mediante `fetch` y envia el token JWT en las rutas protegidas.

Modulos principales:

- Login, recuperacion y cambio de contrasena.
- Panel Director: consolidado, ingresos, egresos, sustentos PDF, direccion, tesoreria, estado de reporte y notificaciones.
- Panel Especialista: explorador de instituciones, detalle financiero, auditoria, alertas, solicitudes y reportes globales.
- Panel Administrador: usuarios, auditoria, logs de acceso, respaldo de base de datos y reportes administrativos.

### Backend

El backend usa Node.js con Express. Centraliza la autenticacion, validacion, persistencia, auditoria y gestion de archivos.

Rutas principales:

- `/api/auth`: login, cambio de contrasena, recuperacion de contrasena y auditoria frontend.
- `/api/movimientos`: ingresos, egresos, saldos bancarios y cierres trimestrales.
- `/api/sustentos`: subida, listado y eliminacion de PDFs.
- `/api/datos-institucionales`: datos de tesoreria y cuenta corriente.
- `/api/especialista`: instituciones, detalle financiero, PDFs, auditoria y reporte global.
- `/api/notificaciones`: notificaciones del director.
- `/api/admin`: usuarios, auditoria, sesiones y backup SQL.
- `/api/solicitudes-reemplazo`: solicitudes de cambio o reemplazo de director.
- `/api/comprobantes`: catalogo de comprobantes por tipo de movimiento.
- `/api/perfil`: datos visuales de perfil cuando existan.

### Base De Datos

La persistencia real se realiza en MySQL. Las tablas principales son:

- `instituciones`: datos de instituciones educativas, codigo modular y RUC opcional.
- `directores`: datos personales y vinculo con la institucion.
- `roles`: catalogo de roles del sistema.
- `usuarios`: cuentas de acceso, hash de contrasena, rol y estado.
- `sesiones`: intentos de inicio de sesion exitosos y fallidos.
- `auditorias`: acciones relevantes realizadas por usuarios.
- `comprobantes`: tipos de comprobante permitidos.
- `movimientos`: ingresos y egresos registrados por director.
- `cierres`: candado trimestral del director.
- `estados`: estado de revision del reporte financiero.
- `sustentos`: metadatos de PDFs subidos por directores.
- `tesoreria`: tesorero, banco y cuenta corriente.
- `perfil`: rutas de imagenes de perfil si se habilitan.
- `saldos`: saldos bancarios trimestrales.
- `notificaciones`: mensajes visibles para directores.
- `solicitudes`: solicitudes de cambio o reemplazo.

## Autenticacion

El login valida contra la tabla `usuarios` de MySQL usando `bcryptjs`. Si las credenciales son correctas, el backend genera un token JWT con el id, correo y rol del usuario.

Flujo resumido:

1. El usuario envia correo y contrasena.
2. El backend busca el correo en `usuarios`.
3. Se compara la contrasena con `password_hash`.
4. Se registra el intento en `sesiones`.
5. Si el login es correcto, se actualiza `ultimo_login`.
6. Se devuelve el token JWT y los datos del usuario.
7. Si el usuario es director, se adjuntan sus datos de `directores` e `instituciones`.

## Flujo Director

El director selecciona anio y trimestre. El sistema carga datos reales desde la base de datos:

- Ingresos y egresos desde `movimientos`.
- Saldos desde `saldos`.
- PDFs desde `sustentos`.
- Estado del reporte desde `estados`.
- Cierre desde `cierres`.
- Datos de tesoreria desde `tesoreria`.
- Notificaciones desde `notificaciones`.

Cuando el director cierra un trimestre, el backend crea el registro en `cierres` y actualiza `estados` a `Enviado`. Desde ese momento la edicion queda bloqueada para ese periodo, salvo que el especialista observe el reporte.

## Flujo Especialista

El especialista consulta instituciones y reportes por anio/trimestre. El sistema cruza datos reales de instituciones, directores, movimientos, saldos, sustentos y estados.

Estados disponibles:

- `Borrador`
- `Enviado`
- `Observado`
- `Aprobado`

Si aprueba, el reporte queda sellado. Si observa, se registra comentario, se notifica al director y se libera el periodo para correccion.

## Archivos PDF

Los PDFs se suben con `multer` y se guardan fisicamente en `backend/uploads/pdfs`. La tabla `sustentos` conserva el nombre original, ruta, tamano, anio, trimestre y director.

En produccion, Render puede borrar archivos si no se usa disco persistente. Para operacion estable se recomienda configurar Persistent Disk o migrar archivos a un servicio externo.

## Auditoria

El sistema registra:

- Intentos de inicio de sesion en `sesiones`.
- Acciones administrativas y operativas en `auditorias`.
- Notificaciones al director en `notificaciones`.
- Cambios de estado del reporte en `estados`.

## Despliegue

- Frontend: Vercel.
- Backend: Render.
- Base de datos: MySQL en servicio externo.

El frontend usa variables de entorno para apuntar al backend desplegado. El backend usa `.env` para credenciales de MySQL, JWT y correo.
