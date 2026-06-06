# Guia De Instalacion Del Sistema UGEL

Esta guia describe como levantar el sistema en un entorno local usando la base de datos real o una copia de respaldo autorizada.

## 1. Requisitos Previos

- Node.js 18 o superior.
- npm.
- Git.
- MySQL local o remoto.
- HeidiSQL, phpMyAdmin u otra herramienta para administrar MySQL.

## 2. Base De Datos

1. Crea una base de datos MySQL.
2. Importa `backend/database/schema.sql`.
3. Si cuentas con un respaldo real autorizado, importalo despues del schema o reemplaza la base local con ese respaldo.
4. Verifica que existan las tablas principales: `usuarios`, `roles`, `instituciones`, `directores`, `movimientos`, `sustentos`, `cierres`, `estados`, `saldos`, `tesoreria`, `notificaciones`, `solicitudes`, `sesiones` y `auditorias`.

El archivo `schema.sql` define la estructura. Los datos reales deben provenir de la base oficial o de un respaldo controlado.

## 3. Backend

Desde la carpeta del backend:

```bash
cd backend
npm install
```

Crea un archivo `.env`:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=firma_secreta_ugel_2026

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ugel_db

EMAIL_HOST=
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
```

Inicia el servidor:

```bash
npm start
```

El backend debe mostrar que el servidor esta activo y que la conexion a MySQL fue exitosa.

## 4. Frontend

Desde la carpeta del frontend:

```bash
cd frontend
npm install
npm start
```

La aplicacion se abrira normalmente en `http://localhost:3000`.

Si el frontend necesita apuntar a un backend especifico, revisa la configuracion de API en `frontend/src/config/api.js` y las variables de entorno correspondientes.

## 5. Accesos

Los accesos deben existir en la tabla `usuarios`. Para directores, el usuario debe estar vinculado a un registro de `directores`, y ese director debe estar vinculado a una `institucion`.

No se recomienda documentar contrasenas reales en este archivo. Para un entorno local, crea usuarios desde el panel administrador o mediante un script autorizado, siempre con contrasenas hasheadas.

## 6. Archivos Subidos

Los PDFs se guardan en:

```text
backend/uploads/pdfs
```

En local, basta con que la carpeta exista. En produccion, Render requiere Persistent Disk o almacenamiento externo para no perder archivos al reiniciar o redesplegar.

## 7. Verificacion Rapida

1. Inicia sesion con un usuario real.
2. Confirma que el rol correcto abre su panel correspondiente.
3. En Director, verifica ingresos, egresos, consolidado, sustentos PDF, tesoreria y estado de reporte.
4. En Especialista, verifica explorador, detalle de colegio, auditoria y reporte global.
5. En Admin, verifica usuarios, sesiones, auditoria y backup.
