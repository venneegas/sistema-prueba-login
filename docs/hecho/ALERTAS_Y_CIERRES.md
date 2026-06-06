# ⏳ Sistema de Alertas y Cierre Automático de Plazos

Este documento detalla el comportamiento de la plataforma frente a las fechas límite establecidas por la UGEL para la declaración de sustentos financieros trimestrales.

## 📅 1. Definición de Fechas Límite
El sistema otorga a los directores **un mes de gracia** tras la finalización de cada trimestre para procesar y subir su información. El plazo vence estrictamente a las **11:59:59 PM** del último día de ese mes de gracia:

*   **1º Trimestre (Ene-Mar):** Vence el 30 de Abril.
*   **2º Trimestre (Abr-Jun):** Vence el 31 de Julio.
*   **3º Trimestre (Jul-Sep):** Vence el 31 de Octubre.
*   **4º Trimestre (Oct-Dic):** Vence el 31 de Enero del año siguiente.

---

## 🔔 2. Alertas Preventivas (Fase de Aviso)
El sistema de notificaciones integrado en el Dashboard del Director calcula en tiempo real los días faltantes basándose en la fecha del equipo/servidor.

*   **Faltan más de 15 días:** Flujo normal, el ícono de notificaciones permanece estático.
*   **Faltan 15 días o menos:**
    *   Aparece un **punto rojo parpadeante** (efecto *ping*) en el ícono de la campana.
    *   Al abrir las notificaciones, se despliega una alerta ámbar indicando la fecha límite exacta y los días restantes.
*   **Faltan 5 días o menos:**
    *   El contador de "días restantes" en el panel de notificaciones cambia a **color rojo** y negrita para enfatizar la urgencia del proceso.

---

## 🔒 3. Cierre Automático (Plazo Vencido)
Una vez superada la fecha y hora límite, la plataforma evalúa la condición matemática de tiempo y pasa automáticamente el trimestre al estado **"Trimestre Finalizado / Cerrado Automáticamente"**. 

Esto activa un **Bloqueo Global de Solo Lectura (Read-Only)** a través de todas las vistas, resguardando la integridad y asegurando que no se registren gastos ni se alteren documentos fuera de fecha.

### 📌 Impacto visual y técnico en la Interfaz
Cuando un trimestre cae en estado de cierre (por plazo vencido o porque el director lo cerró voluntariamente antes de tiempo), el sistema reacciona así:

1.  **Notificaciones (`DirectorDashboard.jsx`):**
    *   La campana reemplaza los avisos previos por una alerta roja crítica: *"Sistema bloqueado automáticamente. El plazo venció el [Fecha]"*.

2.  **Vista de Consolidado (`ConsolidadoView.jsx`):**
    *   Aparece una alerta indicando que el trimestre está cerrado.
    *   Los campos para editar los saldos de la cuenta del Banco de la Nación se bloquean (quedan con fondo gris e inutilizables).
    *   Los botones "Guardar Saldos Banco" y "Cerrar Trimestre" se deshabilitan y cambian a color gris.

3.  **Vistas de Ingresos y Egresos (`IngresosView.jsx` / `EgresosView.jsx`):**
    *   Se muestra una franja de advertencia ámbar en la cabecera.
    *   El botón verde/rojo de **"Agregar Fila"** se deshabilita.
    *   Todos los *inputs* en las tablas (selectores de fecha, listas de comprobantes, descripciones y montos numéricos) entran en modo bloqueado.
    *   Los botones de eliminar filas (`X`) quedan desactivados para evitar pérdida de registros declarados.
    *   El botón final de **"Guardar Mes Actual"** queda completamente bloqueado.

4.  **Vista de Subir Archivos (`SubirPDFView.jsx`):**
    *   Se notifica al usuario que no puede subir ni borrar documentos.
    *   La zona central de arrastrar y soltar (*Drag & Drop*) se vuelve opaca y el cursor cambia a prohibido.
    *   Se interrumpe a nivel de JavaScript la captura de archivos, impidiendo cualquier subida forzada.
    *   El botón para eliminar archivos previamente cargados (icono del tacho de basura) se oculta de la interfaz.
    *   **Excepción positiva:** El usuario aún conserva el derecho a **visualizar (`<Eye/>`)** y **descargar** sus documentos PDF.
