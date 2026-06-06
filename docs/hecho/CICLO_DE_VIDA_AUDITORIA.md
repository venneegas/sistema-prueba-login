# 🔄 Ciclo de Vida de Auditoría Bidireccional

Este documento detalla el flujo completo de declaración, revisión y auditoría entre los Directores de las Instituciones Educativas y los Especialistas de la UGEL, garantizando la integridad de los datos financieros.

## 👥 Actores Principales
1. **👨‍🏫 Director (I.E.):** Responsable de registrar ingresos, egresos, saldos y subir los sustentos en PDF de su propia institución.
2. **🕵️‍♂️ Especialista (UGEL):** Responsable de visualizar (en modo solo lectura), contrastar y emitir un veredicto (Aprobar o Rechazar) sobre las declaraciones de todos los colegios bajo su jurisdicción.

---

## 🚦 Estados del Trimestre (`estados`)
- 🟡 **Borrador:** El director está registrando información. El sistema guarda temporalmente. El especialista lo ve en ámbar y no puede auditarlo.
- 🔵 **Enviado:** El director cerró el trimestre. El sistema bloquea la edición para el director y notifica al especialista.
- 🔴 **Observado:** El especialista encontró discrepancias. El sistema notifica al director y le **desbloquea** la pantalla para corregir.
- 🟢 **Aprobado:** El especialista validó la información. El trimestre se sella de forma inmutable.

---

## 🔄 El Flujo Paso a Paso

### Fase 1: Declaración (El Director)
* El Director ingresa sus movimientos mes a mes y sube su PDF consolidado.
* Al finalizar y estar seguro, presiona el botón **"Cerrar Trimestre"**.
* **Acción del Backend:** 
  1. Crea un "candado" en la tabla `cierres` que bloquea toda la interfaz del director.
  2. Actualiza el estado en la tabla `estados` a **"Enviado"**.

### Fase 2: Auditoría (El Especialista)
* El Especialista entra a su panel explorador y ve la carpeta de la institución en color **Azul (Enviado)**.
* Ingresa a los detalles, visualiza los montos autocalculados (Ingresos, Egresos, Saldo Banco) y visualiza el PDF subido.
* El Especialista toma una decisión vinculante:

#### ❌ Escenario A: Rechazo (Observación)
* El Especialista hace clic en *"Observar / Rechazar"* e ingresa el motivo exacto (Ej. *"Falta comprobante N° 004"*).
* **Acción del Backend (Transacción):**
  1. El estado cambia a **"Observado"** (Rojo).
  2. Se inserta el mensaje de rechazo en la tabla `notificaciones`.
  3. **¡Desbloqueo Inteligente!** El sistema elimina el candado de la tabla `cierres`, devolviéndole al director todos sus permisos de escritura de forma automática.
* **Respuesta del Director:** Ingresa al sistema, ve la "campanita" roja parpadeando, lee la observación del especialista, sube el documento faltante y vuelve a presionar *"Cerrar Trimestre"*, reiniciando el ciclo.

#### ✅ Escenario B: Aprobación Definitiva
* El Especialista considera que todo coincide y hace clic en *"Aprobar Informe"*.
* **Acción del Backend (Transacción):**
  1. El estado cambia a **"Aprobado"** (Verde).
  2. Se envía una notificación de *"Éxito"* al director.
  3. El candado de `cierres` **se mantiene intacto**, sellando la información del trimestre para siempre y dejándola lista para los reportes consolidados de la UGEL.

---
*Nota Arquitectónica: Este diseño elimina la necesidad de intervención del departamento de TI (Administradores) para "desbloquear" colegios por error humano, ya que la comunicación bidireccional y el candado dinámico resuelven el problema orgánicamente.*
