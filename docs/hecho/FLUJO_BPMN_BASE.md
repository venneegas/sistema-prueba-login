# Prompt base para generar diagrama BPMN del sistema

Usa este texto como prompt para una IA o herramienta capaz de generar diagramas BPMN. El objetivo es producir un diagrama claro, horizontal y con carriles, similar a un modelo BPMN de proceso institucional.

---

## Prompt listo para copiar

Genera un diagrama BPMN 2.0 para el sistema web de Gestion Financiera Educativa de la UGEL.

El diagrama debe representar el flujo completo de declaracion financiera trimestral, desde el inicio de sesion del director hasta la revision final del especialista. Debe estar organizado como un diagrama con piscina principal y carriles horizontales, similar a un modelo BPMN con swimlanes.

### Estilo visual requerido

- Usa una piscina principal titulada: "Sistema web basado en Machine Learning para el control de ingresos y egresos".
- Dentro de la piscina usa 4 carriles horizontales:
  1. Director de la I.E.
  2. Sistema
  3. Base de Datos
  4. Especialista UGEL
- El flujo debe ir de izquierda a derecha.
- Usa eventos de inicio y fin.
- Usa tareas rectangulares con bordes redondeados.
- Usa compuertas exclusivas XOR para decisiones de tipo "Si / No".
- Usa objetos de base de datos cuando el sistema consulte o guarde informacion.
- Conecta las actividades con flechas de secuencia.
- Usa lineas punteadas o asociaciones para representar consultas o persistencia hacia la base de datos.
- Mantener el diagrama limpio, legible y no demasiado saturado.
- Las etiquetas deben estar en espanol.

### Actores y responsabilidades

#### Carril 1: Director de la I.E.

El Director de la Institucion Educativa es el usuario que declara la informacion financiera trimestral.

Debe realizar estas actividades:

1. Accede al sistema.
2. Inicia sesion.
3. Cambia contrasena si el sistema lo solicita.
4. Selecciona anio y trimestre.
5. Registra ingresos mensuales.
6. Registra egresos mensuales.
7. Registra saldos de cuenta bancaria.
8. Sube sustentos en PDF.
9. Revisa el consolidado trimestral.
10. Decide si la informacion esta completa.
11. Si falta informacion, corrige ingresos, egresos, saldos o sustentos.
12. Si todo esta correcto, cierra el trimestre.

#### Carril 2: Sistema

El Sistema representa la logica del frontend y backend.

Debe realizar estas actividades:

1. Valida credenciales.
2. Decide si las credenciales son correctas.
3. Si las credenciales son incorrectas, muestra error y permite reintentar.
4. Si las credenciales son correctas, verifica si el usuario debe cambiar contrasena.
5. Si debe cambiar contrasena, actualiza la contrasena.
6. Consulta el estado del trimestre.
7. Decide si el trimestre esta cerrado, vencido o disponible para edicion.
8. Si esta cerrado o vencido, bloquea la edicion y permite solo consulta.
9. Si esta disponible, permite continuar con la declaracion.
10. Valida y guarda ingresos.
11. Valida y guarda egresos.
12. Guarda saldos.
13. Guarda archivos PDF y metadatos de sustentos.
14. Registra el cierre trimestral.
15. Cambia el estado del trimestre a "Enviado".
16. Bloquea la edicion del director.
17. Muestra al especialista el resumen financiero y los PDFs.
18. Si el especialista aprueba, cambia el estado a "Aprobado" y notifica al director.
19. Si el especialista observa, cambia el estado a "Observado", registra comentario, notifica al director y desbloquea la edicion para correccion.

#### Carril 3: Base de Datos

La Base de Datos almacena y devuelve la informacion del sistema.

Debe aparecer como objetos de datos o almacenes de datos relacionados con:

1. Usuarios.
2. Estados y cierres trimestrales.
3. Movimientos financieros.
4. Saldos bancarios.
5. Sustentos PDF.
6. Notificaciones.

Representar las consultas y guardados principales:

- Validar credenciales contra Usuarios.
- Consultar estado del trimestre contra Estados/Cierres.
- Guardar ingresos y egresos en Movimientos.
- Guardar saldos en Saldos.
- Guardar sustentos y metadatos en Sustentos.
- Actualizar estado del trimestre a Enviado, Observado o Aprobado.
- Registrar notificaciones al director.

#### Carril 4: Especialista UGEL

El Especialista UGEL es el usuario auditor que revisa las declaraciones enviadas por los directores.

Debe realizar estas actividades:

1. Revisa colegios con trimestres en estado "Enviado".
2. Abre el detalle de una institucion.
3. Visualiza resumen financiero y sustentos PDF.
4. Evalua la declaracion.
5. Decide si la declaracion es correcta.
6. Si es correcta, aprueba el informe.
7. Si no es correcta, observa el informe e ingresa un comentario.

### Flujo principal detallado

1. Evento de inicio: "Accede al sistema".
2. El Director inicia sesion.
3. El Sistema valida credenciales consultando la Base de Datos: "Usuarios".
4. Compuerta XOR: "Credenciales correctas?"
   - No: el Sistema muestra error. Fin alternativo: "Reintentar login".
   - Si: continuar.
5. Compuerta XOR: "Debe cambiar contrasena?"
   - Si: el Director cambia contrasena, el Sistema actualiza contrasena en Base de Datos y continua.
   - No: continuar.
6. El Director selecciona anio y trimestre.
7. El Sistema consulta el estado del trimestre en Base de Datos: "Estados/Cierres".
8. Compuerta XOR: "Trimestre cerrado o vencido?"
   - Si: el Sistema bloquea edicion y permite solo consulta. Fin alternativo.
   - No: continuar con declaracion.
9. El Director registra ingresos mensuales.
10. El Sistema valida y guarda ingresos en Base de Datos: "Movimientos".
11. El Director registra egresos mensuales.
12. El Sistema valida y guarda egresos en Base de Datos: "Movimientos".
13. El Director registra saldos de cuenta bancaria.
14. El Sistema guarda saldos en Base de Datos: "Saldos".
15. El Director sube sustentos PDF.
16. El Sistema guarda archivos y metadatos en Base de Datos: "Sustentos".
17. El Director revisa el consolidado trimestral.
18. Compuerta XOR: "Informacion completa?"
   - No: el Director corrige ingresos, egresos, saldos o sustentos y vuelve a revisar el consolidado.
   - Si: el Director cierra el trimestre.
19. El Sistema registra el cierre, cambia el estado a "Enviado" y bloquea la edicion.
20. El Sistema actualiza Base de Datos: "Estados/Cierres".
21. El Especialista revisa colegios enviados.
22. El Especialista abre el detalle de la institucion.
23. El Sistema consulta movimientos, saldos y sustentos en Base de Datos.
24. El Sistema muestra resumen financiero y PDFs.
25. El Especialista evalua la declaracion.
26. Compuerta XOR: "Declaracion correcta?"
   - Si: el Especialista aprueba el informe.
   - No: el Especialista observa el informe e ingresa comentario.
27. Si aprueba:
   - El Sistema cambia el estado a "Aprobado".
   - El Sistema registra notificacion al director.
   - Fin: "Trimestre aprobado".
28. Si observa:
   - El Sistema cambia el estado a "Observado".
   - El Sistema registra el comentario y notifica al director.
   - El Sistema desbloquea la edicion para que el director corrija.
   - El flujo vuelve a la etapa de correccion del Director.

### Reglas importantes del proceso

- Mientras el trimestre esta en "Borrador", el Director puede editar la informacion.
- Cuando el Director cierra el trimestre, el estado cambia a "Enviado" y el sistema bloquea la edicion.
- El Especialista solo audita trimestres enviados.
- Si el Especialista aprueba, el estado cambia a "Aprobado" y el trimestre queda bloqueado definitivamente.
- Si el Especialista observa, el estado cambia a "Observado", se registra el motivo y se desbloquea la edicion para que el Director corrija.
- Despues de corregir, el Director vuelve a cerrar el trimestre y el flujo regresa a revision del Especialista.

### Estados del trimestre que deben aparecer

- Borrador: el Director esta registrando o corrigiendo informacion.
- Enviado: el Director cerro el trimestre y espera revision.
- Observado: el Especialista encontro errores y solicito correccion.
- Aprobado: el Especialista valido la declaracion.

### Resultado esperado

Entregar un diagrama BPMN con carriles horizontales que muestre claramente:

- Login y validacion inicial.
- Cambio obligatorio de contrasena, si aplica.
- Seleccion de anio y trimestre.
- Validacion de estado del trimestre.
- Registro de ingresos, egresos, saldos y sustentos.
- Revision y cierre trimestral del Director.
- Auditoria del Especialista.
- Aprobacion u observacion.
- Actualizacion de estados en Base de Datos.
- Notificaciones al Director.
- Ciclo de correccion cuando el informe es observado.

---

## Version resumida del prompt

Genera un diagrama BPMN 2.0 horizontal con una piscina titulada "Sistema web basado en Machine Learning para el control de ingresos y egresos" y 4 carriles: Director de la I.E., Sistema, Base de Datos y Especialista UGEL.

El flujo inicia cuando el Director accede al sistema e inicia sesion. El Sistema valida credenciales contra la Base de Datos. Si son incorrectas, muestra error y finaliza en reintento. Si son correctas, verifica si debe cambiar contrasena. Si debe cambiarla, el Director cambia la contrasena y el Sistema la actualiza en la Base de Datos. Luego el Director selecciona anio y trimestre. El Sistema consulta el estado del trimestre. Si esta cerrado o vencido, bloquea la edicion y finaliza en modo consulta. Si esta disponible, el Director registra ingresos, egresos, saldos bancarios y sustentos PDF. El Sistema valida y guarda cada informacion en la Base de Datos. Luego el Director revisa el consolidado. Si la informacion no esta completa, corrige y vuelve a revisar. Si esta completa, cierra el trimestre. El Sistema registra el cierre, cambia el estado a "Enviado" y bloquea la edicion.

Luego el Especialista UGEL revisa colegios enviados, abre el detalle de una institucion, el Sistema muestra resumen financiero y PDFs consultando la Base de Datos, y el Especialista evalua la declaracion. Si es correcta, aprueba el informe; el Sistema cambia el estado a "Aprobado", notifica al Director y finaliza. Si no es correcta, observa el informe con comentario; el Sistema cambia el estado a "Observado", registra la notificacion, desbloquea la edicion y el flujo vuelve al Director para corregir y cerrar nuevamente.

Usa eventos de inicio y fin, tareas BPMN, compuertas exclusivas XOR con salidas Si/No, almacenes de datos para Usuarios, Estados/Cierres, Movimientos, Saldos, Sustentos y Notificaciones, y flechas de secuencia de izquierda a derecha.

