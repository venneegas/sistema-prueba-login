# Tablas de Historias de Usuario

Este documento contiene solo las tablas de historias de usuario para la seccion 4.5.3. Las evidencias, capturas y diagramas de flujo pueden agregarse despues de cada tabla en el documento principal.

---

## Tabla resumen de historias de usuario

| ID | Historia de Usuario | Nro | Prioridad | Estimacion | Sprint |
|---:|---|---:|---|---:|---:|
| 1 | Inicio de sesion institucional | 1 | Alta | 5 | 1 |
| 2 | Registrar ingresos y egresos mediante formularios web interactivos | 2 | Alta | 8 | 1 |
| 3 | Adjuntar archivos PDF de sustento a cada registro | 3 | Alta | 5 | 1 |
| 4 | Visualizar bandeja de reportes organizados por estado e institucion | 4 | Alta | 8 | 2 |
| 5 | Cambiar el estado de los reportes financieros | 5 | Media | 5 | 2 |
| 6 | Visualizar alertas automaticas de anomalias financieras | 6 | Alta | 8 | 4 |
| 7 | Visualizar el estado actual de los reportes enviados | 7 | Alta | 5 | 2 |
| 8 | Actualizar el modelo de Machine Learning con nuevos datos | 8 | Alta | 13 | 4 |
| 9 | Visualizar dashboards dinamicos financieros | 9 | Media | 8 | 3 |
| 10 | Generar y exportar reportes en PDF y Excel | 10 | Media | 5 | 3 |
| 11 | Consultar historial de cambios y auditoria de reportes | 11 | Media | 5 | 2 |
| 12 | Gestionar usuarios y asignar roles del sistema | 12 | Media | 8 | 2 |

Nota. En la tabla se muestra el resumen de historias de usuario del sistema.

---

## Tabla: Historia de Usuario 001

| Campo | Detalle |
|---|---|
| Numero | 001 |
| Nombre | Inicio de sesion institucional |
| Autor | Usuario del sistema |
| Modificacion de historia numero | - |
| Iteracion asignada | Sprint 1 |
| Prioridad del negocio | Alta |
| Descripcion | El usuario ingresa al sistema mediante sus credenciales institucionales. El sistema valida el correo y la contrasena en la base de datos. Si las credenciales son correctas, permite el acceso segun el rol asignado: director, especialista o administrador. Si el usuario debe cambiar su contrasena, el sistema muestra una ventana de cambio obligatorio antes de ingresar al panel principal. |
| Flujo principal | 1. El usuario abre la pantalla de inicio de sesion. 2. Ingresa correo y contrasena. 3. El sistema valida las credenciales. 4. El sistema identifica el rol del usuario. 5. El usuario accede al panel correspondiente. |
| Flujo alternativo | Si las credenciales son incorrectas, el sistema muestra un mensaje de error. Si el usuario tiene cambio obligatorio de contrasena, el sistema solicita actualizarla antes de continuar. |
| Observacion | Esta historia controla el acceso seguro al sistema y permite separar las funciones segun el rol del usuario. |

Nota. Elaboracion propia de historia de usuario de Inicio de sesion institucional.

---

## Tabla: Historia de Usuario 002

| Campo | Detalle |
|---|---|
| Numero | 002 |
| Nombre | Registrar ingresos y egresos mediante formularios web interactivos |
| Autor | Director |
| Modificacion de historia numero | - |
| Iteracion asignada | Sprint 1 |
| Prioridad del negocio | Alta |
| Descripcion | El director registra los ingresos y egresos mensuales de su institucion educativa mediante formularios web. El sistema permite seleccionar el periodo, ingresar datos financieros, validar campos obligatorios y guardar la informacion en la base de datos. |
| Flujo principal | 1. El director ingresa al modulo de ingresos o egresos. 2. Selecciona anio, trimestre y mes. 3. Registra los datos solicitados en el formulario. 4. El sistema valida la informacion ingresada. 5. El sistema guarda los movimientos financieros. 6. El sistema muestra un mensaje de confirmacion. |
| Flujo alternativo | Si existen campos incompletos o montos invalidos, el sistema muestra una alerta y evita guardar el registro. Si el trimestre esta cerrado, el sistema bloquea la edicion y permite solo consulta. |
| Observacion | Esta historia permite digitalizar el registro financiero mensual y reducir errores en el control de ingresos y egresos. |

Nota. Elaboracion propia de historia de usuario de Registrar ingresos y egresos mediante formularios web interactivos.

---

## Tabla: Historia de Usuario 003

| Campo | Detalle |
|---|---|
| Numero | 003 |
| Nombre | Adjuntar archivos PDF de sustento a cada registro |
| Autor | Director |
| Modificacion de historia numero | - |
| Iteracion asignada | Sprint 1 |
| Prioridad del negocio | Alta |
| Descripcion | El director adjunta documentos PDF como sustento de la informacion financiera declarada. El sistema valida el formato del archivo, registra sus metadatos y almacena la ruta del documento para su posterior consulta. |
| Flujo principal | 1. El director ingresa al modulo de sustentos. 2. Selecciona o arrastra uno o varios archivos PDF. 3. El sistema valida el formato del archivo. 4. El sistema sube el documento. 5. El sistema registra nombre, tamanio, periodo y ruta del archivo. 6. El director visualiza el documento cargado en la lista de sustentos. |
| Flujo alternativo | Si el archivo no es PDF o supera el tamanio permitido, el sistema rechaza la carga y muestra un mensaje de error. Si el trimestre esta cerrado, el sistema bloquea la subida y eliminacion de archivos. |
| Observacion | Esta historia permite respaldar documentalmente la declaracion financiera de cada periodo. |

Nota. Elaboracion propia de historia de usuario de Adjuntar archivos PDF de sustento a cada registro.

---

## Tabla: Historia de Usuario 004

| Campo | Detalle |
|---|---|
| Numero | 004 |
| Nombre | Visualizar bandeja de reportes organizados por estado e institucion |
| Autor | Especialista UGEL |
| Modificacion de historia numero | - |
| Iteracion asignada | Sprint 2 |
| Prioridad del negocio | Alta |
| Descripcion | El especialista visualiza una bandeja de instituciones educativas con sus reportes financieros organizados por anio, trimestre y estado. El sistema muestra el estado de cada declaracion para facilitar la revision y priorizacion. |
| Flujo principal | 1. El especialista ingresa al panel de exploracion. 2. Selecciona anio y trimestre. 3. El sistema consulta las instituciones y sus estados. 4. El sistema muestra la bandeja organizada por institucion. 5. El especialista identifica reportes en estado borrador, enviado, observado o aprobado. |
| Flujo alternativo | Si no existen instituciones o reportes para el periodo seleccionado, el sistema muestra una lista vacia o un mensaje informativo. Si ocurre un error de consulta, el sistema muestra una alerta. |
| Observacion | Esta historia permite centralizar la supervision de reportes financieros por institucion educativa. |

Nota. Elaboracion propia de historia de usuario de Visualizar bandeja de reportes organizados por estado e institucion.

---

## Tabla: Historia de Usuario 005

| Campo | Detalle |
|---|---|
| Numero | 005 |
| Nombre | Cambiar el estado de los reportes financieros |
| Autor | Especialista UGEL |
| Modificacion de historia numero | - |
| Iteracion asignada | Sprint 2 |
| Prioridad del negocio | Media |
| Descripcion | El especialista revisa la declaracion financiera enviada por una institucion y cambia su estado a aprobado u observado. El sistema actualiza el estado del trimestre, registra la decision y notifica al director. |
| Flujo principal | 1. El especialista abre el detalle de una institucion. 2. Revisa ingresos, egresos, saldos y sustentos PDF. 3. El especialista decide aprobar u observar el reporte. 4. El sistema solicita confirmacion o comentario si corresponde. 5. El sistema actualiza el estado del reporte. 6. El sistema registra la notificacion para el director. |
| Flujo alternativo | Si el especialista observa el reporte, debe ingresar el motivo de observacion. Si falta el comentario, el sistema no permite finalizar la observacion. |
| Observacion | Esta historia permite cerrar el ciclo de auditoria entre director y especialista. |

Nota. Elaboracion propia de historia de usuario de Cambiar el estado de los reportes financieros.

---

## Tabla: Historia de Usuario 006

| Campo | Detalle |
|---|---|
| Numero | 006 |
| Nombre | Visualizar alertas automaticas de anomalias financieras |
| Autor | Especialista UGEL |
| Modificacion de historia numero | - |
| Iteracion asignada | Sprint 4 |
| Prioridad del negocio | Alta |
| Descripcion | El especialista visualiza alertas generadas por el sistema cuando se detectan comportamientos financieros inusuales en los ingresos, egresos o saldos declarados por las instituciones educativas. |
| Flujo principal | 1. El especialista ingresa al modulo de alertas. 2. El sistema analiza los registros financieros disponibles. 3. El sistema identifica posibles valores atipicos. 4. El sistema muestra alertas clasificadas por institucion, periodo y tipo de anomalia. 5. El especialista revisa la alerta y decide si requiere observacion. |
| Flujo alternativo | Si no existen datos suficientes para el analisis, el sistema muestra un mensaje indicando que el modelo aun no puede generar alertas confiables. |
| Observacion | Historia planificada para la fase final. Se implementara cuando exista una cantidad suficiente de datos historicos para aplicar el modelo Isolation Forest. |

Nota. Elaboracion propia de historia de usuario de Visualizar alertas automaticas de anomalias financieras.

---

## Tabla: Historia de Usuario 007

| Campo | Detalle |
|---|---|
| Numero | 007 |
| Nombre | Visualizar el estado actual de los reportes enviados |
| Autor | Director |
| Modificacion de historia numero | - |
| Iteracion asignada | Sprint 2 |
| Prioridad del negocio | Alta |
| Descripcion | El director visualiza el estado actual de su reporte financiero trimestral para conocer si se encuentra en borrador, enviado, observado o aprobado. |
| Flujo principal | 1. El director ingresa al sistema. 2. Selecciona el anio y trimestre. 3. El sistema consulta el estado del reporte. 4. El sistema muestra el estado actual. 5. Si el reporte esta observado, el director visualiza la notificacion o comentario del especialista. |
| Flujo alternativo | Si el reporte no ha sido cerrado, el sistema muestra el estado borrador. Si el reporte esta aprobado, el sistema bloquea la edicion y permite solo consulta. |
| Observacion | Esta historia permite que el director tenga trazabilidad del avance de su declaracion financiera. |

Nota. Elaboracion propia de historia de usuario de Visualizar el estado actual de los reportes enviados.

---

## Tabla: Historia de Usuario 008

| Campo | Detalle |
|---|---|
| Numero | 008 |
| Nombre | Actualizar el modelo de Machine Learning con nuevos datos |
| Autor | Administrador o Especialista UGEL |
| Modificacion de historia numero | - |
| Iteracion asignada | Sprint 4 |
| Prioridad del negocio | Alta |
| Descripcion | El sistema permite actualizar el modelo de Machine Learning con nuevos datos historicos de ingresos, egresos y saldos, con la finalidad de mejorar la deteccion de anomalias financieras. |
| Flujo principal | 1. El usuario autorizado ingresa al modulo de configuracion del modelo. 2. El sistema verifica la disponibilidad de datos historicos. 3. El usuario inicia el proceso de actualizacion. 4. El sistema entrena o recalibra el modelo. 5. El sistema guarda la version actualizada del modelo. 6. El sistema muestra el resultado del proceso. |
| Flujo alternativo | Si no existen datos suficientes, el sistema cancela la actualizacion y muestra una advertencia. Si ocurre un error durante el entrenamiento, el sistema registra el incidente. |
| Observacion | Historia planificada para la fase final. No se ejecuta aun porque el sistema no cuenta con suficientes datos reales para entrenar o validar Isolation Forest. |

Nota. Elaboracion propia de historia de usuario de Actualizar el modelo de Machine Learning con nuevos datos.

---

## Tabla: Historia de Usuario 009

| Campo | Detalle |
|---|---|
| Numero | 009 |
| Nombre | Visualizar dashboards dinamicos financieros |
| Autor | Especialista UGEL |
| Modificacion de historia numero | - |
| Iteracion asignada | Sprint 3 |
| Prioridad del negocio | Media |
| Descripcion | El especialista visualiza graficos y resumenes financieros que muestran ingresos, egresos, saldos y estados de las instituciones educativas segun el periodo seleccionado. |
| Flujo principal | 1. El especialista ingresa al modulo de estadisticas o reportes. 2. Selecciona anio y trimestre. 3. El sistema consulta los datos financieros. 4. El sistema calcula totales y consolidados. 5. El sistema muestra graficos y tarjetas resumen. |
| Flujo alternativo | Si no existen datos para el periodo seleccionado, el sistema muestra valores en cero o un mensaje informativo. |
| Observacion | Esta historia facilita el analisis visual de la informacion financiera consolidada. |

Nota. Elaboracion propia de historia de usuario de Visualizar dashboards dinamicos financieros.

---

## Tabla: Historia de Usuario 010

| Campo | Detalle |
|---|---|
| Numero | 010 |
| Nombre | Generar y exportar reportes en PDF y Excel |
| Autor | Director y Especialista UGEL |
| Modificacion de historia numero | - |
| Iteracion asignada | Sprint 3 |
| Prioridad del negocio | Media |
| Descripcion | El usuario genera y exporta reportes financieros en formatos PDF o Excel para conservar evidencia, compartir informacion o realizar revision externa. |
| Flujo principal | 1. El usuario ingresa al modulo de ingresos, egresos o reportes. 2. Selecciona el periodo correspondiente. 3. El sistema carga la informacion financiera. 4. El usuario selecciona exportar a PDF o Excel. 5. El sistema genera el archivo. 6. El usuario descarga el reporte. |
| Flujo alternativo | Si no existen registros para el periodo, el sistema genera un reporte vacio o muestra un mensaje indicando que no hay informacion disponible. |
| Observacion | Esta historia permite obtener respaldo documental de la informacion registrada en el sistema. |

Nota. Elaboracion propia de historia de usuario de Generar y exportar reportes en PDF y Excel.

---

## Tabla: Historia de Usuario 011

| Campo | Detalle |
|---|---|
| Numero | 011 |
| Nombre | Consultar historial de cambios y auditoria de reportes |
| Autor | Administrador |
| Modificacion de historia numero | - |
| Iteracion asignada | Sprint 2 |
| Prioridad del negocio | Media |
| Descripcion | El administrador consulta los registros de auditoria generados por las acciones realizadas en el sistema, permitiendo conocer quien realizo una accion, en que modulo y en que fecha. |
| Flujo principal | 1. El administrador ingresa al modulo de auditoria. 2. El sistema consulta los registros de auditoria. 3. El sistema muestra usuario, rol, modulo, accion, descripcion y fecha. 4. El administrador filtra o revisa los registros disponibles. |
| Flujo alternativo | Si no existen registros, el sistema muestra una tabla vacia. Si ocurre un error de conexion, el sistema muestra una alerta. |
| Observacion | Esta historia fortalece la trazabilidad y control de acciones realizadas dentro del sistema. |

Nota. Elaboracion propia de historia de usuario de Consultar historial de cambios y auditoria de reportes.

---

## Tabla: Historia de Usuario 012

| Campo | Detalle |
|---|---|
| Numero | 012 |
| Nombre | Gestionar usuarios y asignar roles del sistema |
| Autor | Administrador |
| Modificacion de historia numero | - |
| Iteracion asignada | Sprint 2 |
| Prioridad del negocio | Media |
| Descripcion | El administrador gestiona los usuarios del sistema y asigna roles para controlar el acceso a las funcionalidades segun el perfil: director, especialista o administrador. |
| Flujo principal | 1. El administrador ingresa al modulo de gestion de usuarios. 2. El sistema muestra la lista de usuarios registrados. 3. El administrador crea, edita o elimina usuarios. 4. El administrador asigna o actualiza el rol correspondiente. 5. El sistema guarda los cambios y actualiza la lista. |
| Flujo alternativo | Si el correo ya existe, el sistema muestra una advertencia. Si el usuario tiene informacion relacionada, el sistema evita eliminarlo o cambia su estado para conservar la integridad de datos. |
| Observacion | Esta historia permite administrar los accesos y mantener la seguridad por roles dentro del sistema. |

Nota. Elaboracion propia de historia de usuario de Gestionar usuarios y asignar roles del sistema.

