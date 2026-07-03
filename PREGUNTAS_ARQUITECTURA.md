# Preguntas y Respuestas sobre Arquitectura del Sistema

Este documento contiene posibles preguntas de sustentacion sobre la arquitectura del sistema UGEL, su organizacion por capas, componentes principales y preguntas trampa.

## Respuesta General sobre la Arquitectura

Si preguntan sobre la arquitectura, puedes responder:

> El sistema usa una arquitectura web cliente-servidor. El frontend esta desarrollado en React y se encarga de la interfaz del usuario. El backend esta desarrollado en Node.js con Express y expone una API REST. La base de datos es MySQL, donde se guarda la informacion real del sistema. La comunicacion entre frontend y backend se hace mediante HTTP/JSON, y las rutas protegidas usan JWT para autenticar al usuario.

## Diagrama Resumido

```text
Usuario
  |
  v
Frontend React
  |
  | HTTP/JSON + JWT
  v
Backend Node.js + Express
  |
  v
Base de Datos MySQL
```

## Arquitectura por Capas

### Frontend

El frontend esta desarrollado en React. Esta dividido por componentes y vistas segun el rol del usuario: director, especialista y administrador.

Su funcion es mostrar la interfaz, capturar datos, validar algunos campos a nivel visual y consumir los endpoints del backend.

Ejemplos de carpetas:

- `frontend/src/components/director`.
- `frontend/src/components/especialista`.
- `frontend/src/components/admin`.
- `frontend/src/config/api.js`.

### Backend

El backend usa Express y esta organizado por rutas, controladores, middlewares y utilidades.

Las rutas definen los endpoints, los controladores contienen la logica del sistema, los middlewares validan seguridad o archivos, y las utilidades apoyan tareas como auditoria o correo.

Ejemplos importantes:

- `backend/server.js`: punto principal del servidor.
- `backend/routes/`: rutas de la API.
- `backend/controllers/`: logica de negocio.
- `backend/middlewares/`: validacion de token, subida de archivos y otras validaciones.
- `backend/config/db.js`: conexion a MySQL.

### Base de Datos

La base de datos esta en MySQL porque el sistema maneja datos estructurados y relacionados.

Entre las entidades principales estan:

- Usuarios.
- Roles.
- Instituciones.
- Directores.
- Movimientos.
- Saldos.
- Cierres.
- Estados.
- Sustentos.
- Sesiones.
- Auditorias.

### Machine Learning

El modulo de Machine Learning esta separado en Python porque Python tiene librerias especializadas como `scikit-learn`.

El backend puede enviarle datos financieros y recibir alertas de anomalias para apoyar el trabajo del especialista.

### Seguridad

La seguridad se maneja principalmente en backend.

El usuario inicia sesion, el servidor valida sus credenciales, genera un JWT y ese token se usa para acceder a rutas protegidas.

Ademas, se usan middlewares y librerias como:

- `helmet`.
- `cors`.
- `express-rate-limit`.
- Validacion de token JWT.

## Respuesta Corta para Sustentacion

> Mi arquitectura separa responsabilidades: React maneja la interfaz, Express maneja la logica y seguridad, MySQL guarda los datos, y Python se usa para el analisis de anomalias. Esta separacion permite mantener el sistema ordenado, escalable y mas facil de modificar.

## Preguntas Trampa sobre Arquitectura

### 1. Por que no conectas React directamente a MySQL?

Porque seria inseguro. El frontend quedaria expuesto con credenciales y reglas de negocio. La conexion a la base de datos debe pasar por el backend.

### 2. Por que separaste rutas y controladores?

Para mantener el codigo ordenado. Las rutas definen que endpoint existe y los controladores definen que hace ese endpoint.

### 3. Donde esta la logica principal del sistema?

La logica principal esta en el backend, principalmente en los controladores. El frontend no debe contener la logica critica.

### 4. La arquitectura es monolitica o de microservicios?

Es principalmente una arquitectura cliente-servidor con backend monolitico modular. No son microservicios, porque los modulos estan dentro del mismo backend.

### 5. Por que usar API REST?

Porque permite una comunicacion clara entre frontend y backend usando endpoints HTTP y datos JSON.

### 6. Que pasaria si manana quieres hacer una app movil?

Se podria reutilizar el backend y la base de datos, porque la logica esta expuesta mediante API REST. Solo habria que construir otro cliente que consuma los mismos endpoints.

### 7. Que parte se despliega donde?

El frontend se despliega en Vercel, el backend en Render y la base de datos MySQL en un servicio externo.

### 8. Cual es la ventaja de esta arquitectura?

Permite separar responsabilidades, facilita el mantenimiento, mejora la seguridad y hace posible que cada parte evolucione de forma independiente.

## Respuesta Redonda para Exponer

> La arquitectura del sistema es cliente-servidor, organizada por capas. El frontend React se encarga de la presentacion; el backend Express centraliza autenticacion, reglas de negocio, auditoria, subida de archivos y conexion a datos; MySQL asegura la persistencia; y el modulo Python de Isolation Forest funciona como apoyo analitico. Esta estructura evita que el frontend acceda directamente a la base de datos y permite controlar seguridad, permisos y trazabilidad desde el servidor.
