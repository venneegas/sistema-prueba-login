# Prompts BPMN por Historia de Usuario

Este documento contiene prompts listos para generar diagramas BPMN 2.0 por cada historia de usuario del sistema. Cada prompt esta pensado para producir un diagrama pequeno, claro y enfocado en una sola funcionalidad.

## Estilo general para todos los diagramas

Usa estas reglas en todos los prompts:

- Diagrama BPMN 2.0 horizontal.
- Usar una piscina principal titulada: "Sistema web basado en Machine Learning para el control de ingresos y egresos".
- Usar carriles segun los actores de cada historia.
- Usar evento de inicio y evento de fin.
- Usar tareas BPMN con bordes redondeados.
- Usar compuertas exclusivas XOR para decisiones de tipo "Si / No".
- Usar almacenes de datos cuando se consulte o guarde informacion.
- Usar flechas de secuencia de izquierda a derecha.
- Usar etiquetas en espanol.
- Mantener el diagrama limpio y sin saturarlo.

---

## HU-001: Inicio de sesion institucional

```text
Genera un diagrama BPMN 2.0 horizontal para la historia de usuario "Inicio de sesion institucional".

Piscina principal: "Sistema web basado en Machine Learning para el control de ingresos y egresos".

Carriles:
1. Usuario
2. Sistema
3. Base de Datos

Flujo:
1. Evento de inicio: "Accede al sistema".
2. Usuario ingresa correo y contraseña.
3. Sistema valida campos obligatorios.
4. Sistema consulta credenciales en Base de Datos: "Usuarios" y "Roles".
5. Compuerta XOR: "Credenciales correctas?"
   - No: Sistema muestra mensaje de error. Fin alternativo: "Reintentar inicio de sesión".
   - Si: continuar.
6. Sistema verifica estado del usuario.
7. Compuerta XOR: "Usuario activo?"
   - No: Sistema bloquea acceso y muestra aviso. Fin alternativo: "Acceso denegado".
   - Si: continuar.
8. Sistema identifica rol del usuario.
9. Compuerta XOR: "Debe cambiar contraseña?"
   - Si: Usuario registra nueva contraseña, Sistema actualiza la contraseña en Base de Datos y continua.
   - No: continuar.
10. Sistema redirige al panel correspondiente segun rol: Director, Especialista o Administrador.
11. Evento de fin: "Sesión iniciada correctamente".

Usa compuertas XOR para las decisiones y un almacen de datos para Usuarios/Roles.
```

---

## HU-002: Registrar ingresos y egresos mediante formularios web interactivos

```text
Genera un diagrama BPMN 2.0 horizontal para la historia de usuario "Registrar ingresos y egresos mediante formularios web interactivos".

Piscina principal: "Sistema web basado en Machine Learning para el control de ingresos y egresos".

Carriles:
1. Director de la I.E.
2. Sistema
3. Base de Datos

Flujo:
1. Evento de inicio: "Director ingresa al modulo financiero".
2. Director selecciona anño y trimestre.
3. Director selecciona el mes que va a registrar.
4. Director elige registrar ingresos o egresos.
5. Sistema consulta si el trimestre esta cerrado en Base de Datos: "Cierres/Estados".
6. Compuerta XOR: "Trimestre cerrado?"
   - Si: Sistema bloquea edición y permite solo consulta. Fin alternativo.
   - No: continuar.
7. Director completa formulario con fecha, tipo de comprobante, número, concepto y monto.
8. Sistema valida campos obligatorios y formato de datos.
9. Compuerta XOR: "¿Datos válidos?"
   - No: Sistema muestra alerta de validacion y vuelve al formulario.
   - Si: continuar.
10. Sistema guarda los movimientos en Base de Datos: "Movimientos".
11. Sistema muestra mensaje de confirmacion.
12. Evento de fin: "Ingresos o egresos registrados".

Representa las validaciones con compuertas XOR y la persistencia con un almacen de datos llamado "Movimientos".
```

---

## HU-003: Adjuntar archivos PDF de sustento a cada registro

```text
Genera un diagrama BPMN 2.0 horizontal para la historia de usuario "Adjuntar archivos PDF de sustento a cada registro".

Piscina principal: "Sistema web basado en Machine Learning para el control de ingresos y egresos".

Carriles:
1. Director de la I.E.
2. Sistema
3. Almacenamiento / Base de Datos

Flujo:
1. Evento de inicio: "Director ingresa al modulo de sustentos".
2. Director selecciona anio y trimestre.
3. Sistema consulta estado del trimestre en Base de Datos: "Cierres/Estados".
4. Compuerta XOR: "Trimestre cerrado?"
   - Si: Sistema bloquea subida y eliminacion de archivos. Fin alternativo: "Solo consulta de PDFs".
   - No: continuar.
5. Director selecciona o arrastra uno o varios archivos PDF.
6. Sistema valida formato del archivo.
7. Compuerta XOR: "Archivo es PDF?"
   - No: Sistema muestra mensaje de error. Fin alternativo: "Archivo rechazado".
   - Si: continuar.
8. Sistema valida tamanio maximo permitido.
9. Compuerta XOR: "Tamanio permitido?"
   - No: Sistema muestra mensaje de error. Fin alternativo.
   - Si: continuar.
10. Sistema guarda archivo en almacenamiento.
11. Sistema registra metadatos en Base de Datos: nombre, ruta, tamanio, anio y trimestre.
12. Director visualiza el PDF en la lista de sustentos.
13. Evento de fin: "Sustento PDF registrado".
```

---

## HU-004: Visualizar bandeja de reportes organizados por estado e institucion

```text
Genera un diagrama BPMN 2.0 horizontal para la historia de usuario "Visualizar bandeja de reportes organizados por estado e institucion".

Piscina principal: "Sistema web basado en Machine Learning para el control de ingresos y egresos".

Carriles:
1. Especialista UGEL
2. Sistema
3. Base de Datos

Flujo:
1. Evento de inicio: "Especialista ingresa al panel de exploracion".
2. Especialista selecciona anio y trimestre.
3. Sistema consulta instituciones, directores y estados en Base de Datos.
4. Sistema muestra bandeja de instituciones educativas.
5. Especialista usa buscador por nombre, codigo modular o numero de I.E.
6. Especialista filtra por estado: Borrador, Enviado, Observado o Aprobado.
7. Sistema actualiza la lista segun filtros.
8. Compuerta XOR: "Existen reportes para mostrar?"
   - No: Sistema muestra mensaje "No se encontraron colegios".
   - Si: Sistema muestra tarjetas o filas de instituciones.
9. Especialista selecciona una institucion.
10. Evento de fin: "Institucion seleccionada para revision".

Usa un almacen de datos llamado "Instituciones / Estados" y representa la seleccion de filtros como tareas del especialista.
```

---

## HU-005: Cambiar el estado de los reportes financieros

```text
Genera un diagrama BPMN 2.0 horizontal para la historia de usuario "Cambiar el estado de los reportes financieros".

Piscina principal: "Sistema web basado en Machine Learning para el control de ingresos y egresos".

Carriles:
1. Especialista UGEL
2. Sistema
3. Base de Datos
4. Director de la I.E.

Flujo:
1. Evento de inicio: "Especialista abre detalle de una institucion".
2. Sistema consulta resumen financiero y sustentos PDF en Base de Datos.
3. Sistema muestra ingresos, egresos, saldo en caja, saldo bancario y PDFs.
4. Especialista revisa la declaracion financiera.
5. Compuerta XOR: "Declaracion correcta?"
   - Si: continuar por aprobacion.
   - No: continuar por observacion.
6. Ruta aprobacion:
   - Especialista selecciona "Aprobar informe".
   - Sistema solicita confirmacion.
   - Sistema actualiza estado a "Aprobado" en Base de Datos.
   - Sistema registra notificacion para el director.
   - Director recibe notificacion de aprobacion.
   - Fin: "Reporte aprobado".
7. Ruta observacion:
   - Especialista selecciona "Observar informe".
   - Sistema solicita comentario obligatorio.
   - Compuerta XOR: "Comentario ingresado?"
      - No: Sistema muestra alerta y vuelve al formulario de observacion.
      - Si: continuar.
   - Sistema actualiza estado a "Observado" en Base de Datos.
   - Sistema elimina o libera el cierre para permitir correccion.
   - Sistema registra notificacion para el director.
   - Director recibe notificacion de observacion.
   - Fin: "Reporte observado y habilitado para correccion".

Usa compuerta XOR para la decision de aprobacion u observacion.
```

---

## HU-006: Visualizar alertas automaticas de anomalias financieras

```text
Genera un diagrama BPMN 2.0 horizontal para la historia de usuario "Visualizar alertas automaticas de anomalias financieras".

Nota: Esta historia pertenece a la fase final del proyecto, porque requiere datos historicos suficientes para aplicar Isolation Forest.

Piscina principal: "Sistema web basado en Machine Learning para el control de ingresos y egresos".

Carriles:
1. Especialista UGEL
2. Sistema
3. Modelo de Machine Learning
4. Base de Datos

Flujo:
1. Evento de inicio: "Especialista ingresa al modulo de alertas".
2. Sistema consulta datos historicos de ingresos, egresos y saldos.
3. Sistema verifica disponibilidad de datos.
4. Compuerta XOR: "Existen datos suficientes?"
   - No: Sistema muestra mensaje "No hay datos suficientes para generar alertas confiables". Fin alternativo.
   - Si: continuar.
5. Sistema envia datos al modelo Isolation Forest.
6. Modelo analiza patrones y detecta posibles anomalias.
7. Sistema recibe resultados del modelo.
8. Compuerta XOR: "Se detectaron anomalias?"
   - No: Sistema muestra mensaje "No se encontraron anomalias". Fin.
   - Si: Sistema muestra alertas por institucion, periodo y tipo de anomalia.
9. Especialista revisa alerta.
10. Especialista decide si corresponde observar el reporte.
11. Evento de fin: "Alertas revisadas".
```

---

## HU-007: Visualizar el estado actual de los reportes enviados

```text
Genera un diagrama BPMN 2.0 horizontal para la historia de usuario "Visualizar el estado actual de los reportes enviados".

Piscina principal: "Sistema web basado en Machine Learning para el control de ingresos y egresos".

Carriles:
1. Director de la I.E.
2. Sistema
3. Base de Datos

Flujo:
1. Evento de inicio: "Director ingresa al panel".
2. Director selecciona anio y trimestre.
3. Sistema consulta estado del reporte en Base de Datos: "Estados/Cierres".
4. Sistema consulta notificaciones relacionadas al director.
5. Sistema muestra estado actual del trimestre.
6. Compuerta XOR: "Estado del reporte?"
   - Borrador: Sistema permite editar informacion.
   - Enviado: Sistema bloquea edicion y muestra aviso "Enviado para revision".
   - Observado: Sistema muestra comentario del especialista y habilita correccion.
   - Aprobado: Sistema bloquea edicion definitiva y permite solo consulta.
7. Director revisa el estado y las notificaciones.
8. Evento de fin: "Estado del reporte visualizado".

Usa una compuerta basada en estados: Borrador, Enviado, Observado y Aprobado.
```

---

## HU-008: Actualizar el modelo de Machine Learning con nuevos datos

```text
Genera un diagrama BPMN 2.0 horizontal para la historia de usuario "Actualizar el modelo de Machine Learning con nuevos datos".

Nota: Esta historia pertenece a la fase final del proyecto. Actualmente no se ejecuta porque todavia no existen datos historicos suficientes para entrenar y validar Isolation Forest.

Piscina principal: "Sistema web basado en Machine Learning para el control de ingresos y egresos".

Carriles:
1. Administrador o Especialista UGEL
2. Sistema
3. Modelo de Machine Learning
4. Base de Datos

Flujo:
1. Evento de inicio: "Usuario autorizado ingresa al modulo de configuracion del modelo".
2. Sistema consulta datos historicos en Base de Datos.
3. Compuerta XOR: "Datos suficientes para entrenar?"
   - No: Sistema muestra advertencia y cancela actualizacion. Fin alternativo.
   - Si: continuar.
4. Usuario inicia proceso de actualizacion del modelo.
5. Sistema prepara dataset de ingresos, egresos y saldos.
6. Sistema envia dataset al modelo Isolation Forest.
7. Modelo entrena o recalibra parametros.
8. Compuerta XOR: "Entrenamiento exitoso?"
   - No: Sistema registra error y muestra mensaje. Fin alternativo.
   - Si: continuar.
9. Sistema guarda version actualizada del modelo.
10. Sistema registra evento de actualizacion.
11. Usuario visualiza resultado del proceso.
12. Evento de fin: "Modelo actualizado".
```

---

## HU-009: Visualizar dashboards dinamicos financieros

```text
Genera un diagrama BPMN 2.0 horizontal para la historia de usuario "Visualizar dashboards dinamicos financieros".

Piscina principal: "Sistema web basado en Machine Learning para el control de ingresos y egresos".

Carriles:
1. Especialista UGEL
2. Sistema
3. Base de Datos

Flujo:
1. Evento de inicio: "Especialista ingresa al modulo de reportes y estadisticas".
2. Especialista selecciona anio y trimestre.
3. Sistema consulta colegios, estados, ingresos, egresos y saldos.
4. Sistema calcula totales generales y porcentajes.
5. Sistema calcula avance de envios, tasa de aprobacion e indice de observaciones.
6. Compuerta XOR: "Existen datos financieros?"
   - No: Sistema muestra mensaje "No hay datos financieros para graficar". Fin alternativo.
   - Si: continuar.
7. Sistema muestra tarjetas resumen.
8. Sistema muestra graficos de ingresos y egresos por institucion.
9. Especialista analiza la informacion consolidada.
10. Evento de fin: "Dashboard financiero visualizado".

Representa los calculos como tareas del Sistema y la consulta de datos con un almacen de datos financiero.
```

---

## HU-010: Generar y exportar reportes en PDF y Excel

```text
Genera un diagrama BPMN 2.0 horizontal para la historia de usuario "Generar y exportar reportes en PDF y Excel".

Piscina principal: "Sistema web basado en Machine Learning para el control de ingresos y egresos".

Carriles:
1. Usuario
2. Sistema
3. Base de Datos
4. Archivo generado

Flujo:
1. Evento de inicio: "Usuario ingresa al modulo de reportes".
2. Usuario selecciona anio, trimestre y tipo de reporte.
3. Sistema consulta datos financieros en Base de Datos.
4. Compuerta XOR: "Existen datos para el reporte?"
   - No: Sistema muestra mensaje "No hay informacion disponible". Fin alternativo.
   - Si: continuar.
5. Usuario selecciona formato de exportacion.
6. Compuerta XOR: "Formato seleccionado?"
   - PDF: Sistema genera archivo PDF.
   - Excel: Sistema genera archivo Excel.
7. Sistema prepara el archivo con datos, totales y encabezados.
8. Sistema entrega archivo generado al usuario.
9. Usuario descarga el reporte.
10. Evento de fin: "Reporte exportado".

Usa una compuerta XOR para decidir entre PDF y Excel. Representa el resultado con un objeto de datos llamado "Archivo PDF/Excel".
```

---

## HU-011: Consultar historial de cambios y auditoria de reportes

```text
Genera un diagrama BPMN 2.0 horizontal para la historia de usuario "Consultar historial de cambios y auditoria de reportes".

Piscina principal: "Sistema web basado en Machine Learning para el control de ingresos y egresos".

Carriles:
1. Administrador
2. Sistema
3. Base de Datos

Flujo:
1. Evento de inicio: "Administrador ingresa al modulo de auditoria".
2. Sistema valida permisos del administrador.
3. Compuerta XOR: "Tiene permisos?"
   - No: Sistema muestra acceso denegado. Fin alternativo.
   - Si: continuar.
4. Sistema consulta registros de auditoria en Base de Datos.
5. Compuerta XOR: "Existen registros?"
   - No: Sistema muestra tabla vacia o mensaje informativo. Fin alternativo.
   - Si: continuar.
6. Sistema muestra tabla con fecha, usuario, rol, modulo, accion y descripcion.
7. Administrador filtra por usuario, modulo, accion o fecha.
8. Sistema actualiza resultados filtrados.
9. Administrador revisa trazabilidad de acciones.
10. Evento de fin: "Historial de auditoria consultado".

Representa la consulta a Base de Datos con un almacen llamado "Auditorias".
```

---

## HU-012: Gestionar usuarios y asignar roles del sistema

```text
Genera un diagrama BPMN 2.0 horizontal para la historia de usuario "Gestionar usuarios y asignar roles del sistema".

Piscina principal: "Sistema web basado en Machine Learning para el control de ingresos y egresos".

Carriles:
1. Administrador
2. Sistema
3. Base de Datos

Flujo:
1. Evento de inicio: "Administrador ingresa al modulo de gestion de usuarios".
2. Sistema valida permisos del administrador.
3. Compuerta XOR: "Tiene permisos?"
   - No: Sistema muestra acceso denegado. Fin alternativo.
   - Si: continuar.
4. Sistema consulta usuarios y roles en Base de Datos.
5. Sistema muestra lista de usuarios.
6. Administrador elige accion: crear, editar o eliminar/suspender usuario.
7. Compuerta XOR: "Accion seleccionada?"
   - Crear: Administrador ingresa nombre, correo, contrasena temporal y rol.
   - Editar: Administrador modifica datos o rol del usuario.
   - Eliminar/Suspender: Administrador confirma la accion.
8. Sistema valida datos ingresados.
9. Compuerta XOR: "Datos validos?"
   - No: Sistema muestra mensaje de error y vuelve al formulario.
   - Si: continuar.
10. Sistema guarda cambios en Base de Datos: "Usuarios/Roles".
11. Sistema registra accion en auditoria.
12. Sistema actualiza lista de usuarios.
13. Evento de fin: "Gestion de usuario completada".

Usa compuertas XOR para permisos, accion seleccionada y validacion de datos.
```

