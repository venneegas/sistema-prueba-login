# Preguntas y Respuestas para Sustentacion del Proyecto UGEL

Este documento resume posibles preguntas de sustentacion sobre el sistema, incluyendo frontend, backend, base de datos, seguridad, Machine Learning y preguntas trampa.

## Preguntas Generales del Sistema

### 1. Cual es el problema que resuelve tu sistema?

El sistema moderniza la declaracion, revision y auditoria de recursos propios de instituciones educativas, evitando procesos manuales, perdida de sustentos y falta de trazabilidad.

### 2. Que actores existen en el sistema?

Existen tres actores principales:

- Director.
- Especialista.
- Administrador.

### 3. Que puede hacer cada rol?

El director registra ingresos, egresos, saldos, PDFs y cierra el trimestre.

El especialista revisa, observa, aprueba y consulta alertas o reportes.

El administrador gestiona usuarios, auditoria, sesiones y reportes administrativos.

### 4. Cual es el flujo principal?

El director registra informacion financiera por anio y trimestre, sube sustentos, cierra el reporte, y luego el especialista lo revisa para aprobarlo u observarlo.

### 5. Que estados maneja el reporte?

El reporte maneja los siguientes estados:

- Borrador.
- Enviado.
- Observado.
- Aprobado.

## Preguntas de Frontend

### 6. Por que usaste React?

Se uso React porque permite construir la interfaz por componentes reutilizables, manejar estados con hooks y consumir facilmente una API REST.

### 7. Como se comunica el frontend con el backend?

El frontend se comunica con el backend mediante peticiones HTTP/JSON usando `fetch`, enviando el token JWT en las rutas protegidas.

### 8. Como manejas las vistas segun el rol?

Despues del login, el sistema identifica el rol del usuario y muestra el dashboard correspondiente: director, especialista o administrador.

### 9. Que componentes importantes tiene el frontend?

El frontend incluye componentes como login, recuperacion de contrasena, dashboards por rol, vistas de ingresos y egresos, subida de PDFs, auditoria, reportes, alertas y configuracion.

### 10. Pregunta trampa: El frontend valida los datos, entonces ya no hace falta validar en backend?

No. El frontend ayuda a mejorar la experiencia del usuario, pero la validacion importante debe estar en backend porque el cliente puede ser manipulado.

### 11. Pregunta trampa: Donde guardas datos sensibles en React?

No se deben guardar contrasenas ni datos criticos en el frontend. El token puede usarse para la sesion, pero debe manejarse con cuidado y el backend debe validar siempre.

## Preguntas de Backend

### 12. Que arquitectura usa tu backend?

El backend usa Node.js con Express, organizado en rutas, controladores, middlewares, utilidades y conexion a MySQL.

### 13. Que es una API REST en tu sistema?

Es el conjunto de endpoints como `/api/auth`, `/api/movimientos`, `/api/sustentos`, `/api/especialista`, entre otros, que permiten al frontend interactuar con los datos del sistema.

### 14. Para que usas middlewares?

Se usan middlewares para tareas intermedias como validar JWT, manejar CORS, aplicar seguridad con Helmet, limitar intentos con rate limit y gestionar subida de archivos con Multer.

### 15. Como proteges las rutas?

Las rutas se protegen con JWT. El usuario inicia sesion, recibe un token y luego lo envia en las peticiones protegidas. El backend verifica ese token antes de permitir el acceso.

### 16. Que hace Helmet?

Helmet agrega cabeceras HTTP de seguridad para reducir riesgos comunes en aplicaciones web.

### 17. Que hace express-rate-limit?

`express-rate-limit` limita la cantidad de intentos en rutas sensibles, especialmente login, para reducir ataques de fuerza bruta.

### 18. Pregunta trampa: Si alguien cambia el rol desde el frontend, puede entrar como administrador?

No deberia poder, porque el backend no debe confiar en el frontend. El rol valido sale del token y de la base de datos.

## Preguntas de Base de Datos

### 19. Por que usas MySQL?

Se usa MySQL porque el sistema maneja informacion estructurada: usuarios, instituciones, movimientos, saldos, sustentos, estados, auditorias y sesiones.

### 20. Que tablas principales tiene tu sistema?

Las tablas principales son:

- `usuarios`.
- `roles`.
- `directores`.
- `instituciones`.
- `movimientos`.
- `saldos`.
- `sustentos`.
- `cierres`.
- `estados`.
- `auditorias`.
- `sesiones`.
- `notificaciones`.
- `solicitudes`.

### 21. Como relacionas un director con una institucion?

Se relaciona mediante claves foraneas o campos de relacion entre las tablas `directores` e `instituciones`.

### 22. Por que separas ingresos, egresos, saldos y sustentos?

Porque permite mantener los datos organizados, evitar duplicidad y facilitar consultas por trimestre, anio e institucion.

### 23. Pregunta trampa: Por que no guardar todo en una sola tabla?

Porque una sola tabla seria dificil de mantener, generaria redundancia, problemas de integridad y consultas menos claras.

## Preguntas de Seguridad

### 24. Como almacenas las contrasenas?

Las contrasenas se almacenan hasheadas con `bcryptjs`, no en texto plano.

### 25. Que es JWT?

JWT es un token firmado que permite identificar al usuario autenticado en peticiones posteriores.

### 26. Que pasa si el token es invalido?

El backend rechaza la peticion y no permite acceder a la ruta protegida.

### 27. Que riesgos tiene subir PDFs?

Existen riesgos como archivos maliciosos, exceso de tamanio, extensiones no permitidas o perdida de archivos si el servidor no tiene almacenamiento persistente.

### 28. Como registrarias acciones importantes?

Mediante auditoria, guardando usuario, accion, fecha, modulo afectado y detalles relevantes.

### 29. Pregunta trampa: El sistema es 100% seguro?

No existe un sistema 100% seguro. Se aplican medidas como JWT, hash de contrasenas, rate limit, Helmet, validaciones y auditoria, pero siempre hay mejoras posibles.

## Preguntas sobre Machine Learning e Isolation Forest

### 30. Para que usas Isolation Forest?

Se usa para detectar posibles anomalias financieras entre instituciones, por ejemplo saldos, ingresos o egresos que se alejan del comportamiento general.

### 31. Que variables usa el modelo?

El modelo usa variables como `saldo_inicial`, ingresos por mes, egresos por mes, total de ingresos, total de egresos, dinero en caja, saldos bancarios, saldo final y ratios financieros.

### 32. Por que Isolation Forest?

Porque es un algoritmo no supervisado util para detectar datos atipicos sin necesitar etiquetas previas de "normal" o "fraude".

### 33. El modelo detecta fraude?

No directamente. Detecta anomalias o comportamientos atipicos. Una anomalia no significa fraude; significa que merece revision.

### 34. Pregunta trampa: Si el modelo marca una institucion como anomala, automaticamente esta mal?

No. El modelo solo genera una alerta preventiva. La decision final debe tomarla el especialista revisando los sustentos y el contexto.

### 35. Por que necesitas al menos 5 colegios completos?

Porque el modelo necesita una cantidad minima de datos para comparar patrones. Con muy pocos registros, la deteccion seria poco confiable.

### 36. Que significa risk_score?

`risk_score` es una normalizacion del puntaje de anomalia entre 0 y 100 para hacerlo mas entendible visualmente.

### 37. Que significa top_features?

`top_features` son las variables que mas se desviaron respecto al promedio del conjunto, utiles para explicar por que una fila parece anomala.

## Preguntas Trampa Fuertes

### 38. Tu sistema reemplaza al especialista?

No. El sistema apoya su trabajo, organiza informacion, genera alertas y reportes, pero la revision final sigue siendo humana.

### 39. Que pasa si Render borra los PDFs?

Si no se configura almacenamiento persistente, los archivos pueden perderse. Por eso se recomienda Persistent Disk o almacenamiento externo.

### 40. Por que no hacer todo en el frontend?

Porque la logica critica, autenticacion, validacion, persistencia y seguridad deben estar en backend.

### 41. Que pasa si dos usuarios editan el mismo trimestre?

El sistema debe controlar estados y cierres para evitar inconsistencias. Una vez cerrado o enviado, se bloquea la edicion salvo que el especialista observe el reporte.

### 42. Que limitacion tiene tu sistema?

Puede depender de conexion a internet, calidad de datos ingresados, configuracion correcta del servidor y persistencia de archivos.

### 43. Que mejorarias a futuro?

Se podria mejorar con validaciones mas completas, almacenamiento externo de PDFs, backups automaticos, pruebas automatizadas, control mas fino de permisos, dashboards estadisticos y explicacion mas avanzada del modelo ML.

### 44. Como sabes que los datos son confiables?

Se validan campos, se registran sustentos, se auditan acciones y el especialista revisa antes de aprobar. Aun asi, depende de que el director ingrese informacion correcta.

### 45. Que parte defenderias como aporte principal?

El aporte principal es la integracion del flujo completo: registro financiero, sustentos, cierre trimestral, revision por especialista, auditoria, reportes y alertas con apoyo de Machine Learning.

## Frase Recomendada para Cerrar la Sustentacion

> El sistema no solo digitaliza el registro de recursos propios, sino que estructura el proceso de control: permite trazabilidad, revision por estados, evidencia documental, seguridad por roles y alertas preventivas para apoyar la toma de decisiones del especialista.
