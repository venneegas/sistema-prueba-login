# 📊 Flujo BPMN: Sistema de Gestión Financiera Educativa

Este documento describe el flujo de procesos de negocio (BPMN) base del sistema, mapeado a través de 4 carriles (pools/lanes) principales:

1. **👨‍🏫 Director de la I.E.** (Usuario declarante)
2. **⚙️ Sistema** (Lógica de negocio, frontend/backend)
3. **🗄️ Base de Datos** (Almacenamiento y persistencia)
4. **🕵️ Especialista** (Auditor de UGEL)

---

## 1. Diagrama de Flujo (Mermaid)

*Nota: Si tu visor de Markdown soporta Mermaid, verás el diagrama renderizado a continuación.*

```mermaid
flowchart TD
    %% Definición de Carriles
    subgraph Director [1. Director de la I.E.]
        DIR_1([Inicio]) --> DIR_2(Inicia sesión)
        DIR_3(Cambia contraseña)
        DIR_4(Selecciona año y trimestre)
        DIR_5(Registra ingresos mensuales)
        DIR_6(Registra egresos mensuales)
        DIR_7(Registra saldos de cuenta bancaria)
        DIR_8(Sube sustentos PDF)
        DIR_9(Revisa consolidado trimestral)
        DIR_10{¿Info completa?}
        DIR_11(Cierra trimestre)
        DIR_12(Corrige ingresos/egresos/saldos/sustentos)
    end

    subgraph Sistema [2. Sistema]
        SYS_1(Valida credenciales)
        SYS_2{¿Credenciales correctas?}
        SYS_3(Muestra error)
        SYS_4{¿Debe cambiar contraseña?}
        SYS_5(Actualiza contraseña)
        SYS_6(Consulta estado del trimestre)
        SYS_7{¿Trimestre cerrado o vencido?}
        SYS_8(Bloquea edición y permite solo consulta)
        SYS_9(Valida y guarda ingresos)
        SYS_10(Valida y guarda egresos)
        SYS_11(Guarda saldos)
        SYS_12(Guarda archivos y metadatos)
        SYS_13(Registra cierre, cambia a 'Enviado' y bloquea)
        SYS_14(Muestra resumen financiero y PDFs)
        SYS_15(Cambia estado a 'Aprobado' y notifica al director)
        SYS_16(Cambia estado a 'Observado' y notifica al director)
    end

    subgraph BaseDatos [3. Base de Datos]
        DB_1[(Tabla Usuarios)]
        DB_2[(Tabla Estados/Cierres)]
        DB_3[(Tabla Movimientos)]
        DB_4[(Tablas Saldos y Sustentos)]
    end

    subgraph Especialista [4. Especialista]
        ESP_1(Revisa colegios enviados)
        ESP_2(Abre detalle de institución)
        ESP_3(Evalúa declaración)
        ESP_4{¿Declaración correcta?}
        ESP_5(Aprobar informe)
        ESP_6(Observar informe con comentario)
    end

    %% Rutas - Autenticación
    DIR_2 --> SYS_1 <--> DB_1
    SYS_1 --> SYS_2
    SYS_2 -- No --> SYS_3 --> FIN_1([Fin / Reintentar])
    SYS_2 -- Sí --> SYS_4
    
    SYS_4 -- Sí --> DIR_3 --> SYS_5 <--> DB_1
    SYS_5 --> DIR_4
    SYS_4 -- No --> DIR_4

    %% Rutas - Preparación Trimestre
    DIR_4 --> SYS_6 <--> DB_2
    SYS_6 --> SYS_7
    SYS_7 -- Sí --> SYS_8 --> FIN_2([Fin])
    SYS_7 -- No --> DIR_5

    %% Rutas - Declaración
    DIR_5 --> SYS_9 <--> DB_3
    SYS_9 --> DIR_6
    DIR_6 --> SYS_10 <--> DB_3
    SYS_10 --> DIR_7
    DIR_7 --> SYS_11 <--> DB_4
    SYS_11 --> DIR_8
    DIR_8 --> SYS_12 <--> DB_4
    SYS_12 --> DIR_9

    %% Rutas - Revisión y Cierre
    DIR_9 --> DIR_10
    DIR_10 -- No --> DIR_12 --> DIR_5
    DIR_10 -- Sí --> DIR_11
    DIR_11 --> SYS_13 <--> DB_2
    
    %% Rutas - Auditoría Especialista
    SYS_13 --> ESP_1
    ESP_1 --> ESP_2 --> SYS_14
    SYS_14 <--> DB_3
    SYS_14 <--> DB_4
    SYS_14 --> ESP_3
    ESP_3 --> ESP_4
    
    ESP_4 -- Sí --> ESP_5 --> SYS_15 <--> DB_2
    SYS_15 --> FIN_3([Fin])
    
    ESP_4 -- No --> ESP_6 --> SYS_16 <--> DB_2
    SYS_16 --> FIN_4([Fin / Revisión Posterior])
```

---

## 2. Descripción Paso a Paso del Flujo

### Fase A: Inicio y Autenticación
1. **[Director]** Inicia sesión ingresando sus credenciales.
2. **[Sistema]** Toma las credenciales y las valida consultando a la **[Base de Datos]**.
3. **[Sistema]** ¿Credenciales correctas?
   - **No:** Muestra mensaje de error -> **Fin / Reintentar**.
   - **Sí:** Verifica el rol del usuario y avanza.
4. **[Sistema]** Verifica: ¿Debe cambiar contraseña?
   - **Sí:** **[Director]** cambia la contraseña -> **[Sistema]** actualiza y guarda en la **[Base de Datos]**.
   - **No:** Continúa directamente.

### Fase B: Configuración del Trimestre
5. **[Director]** Selecciona el año y trimestre sobre el cual va a declarar.
6. **[Sistema]** Consulta el estado del trimestre en la **[Base de Datos]**.
7. **[Sistema]** ¿Trimestre cerrado o vencido?
   - **Sí:** Bloquea edición y permite solo acceso en modo consulta/exportación -> **Fin**.
   - **No:** Continúa habilitando la edición.

### Fase C: Declaración Financiera
8. **[Director]** Registra ingresos mensuales.
9. **[Sistema]** Valida y guarda los ingresos en la **[Base de Datos]**.
10. **[Director]** Registra egresos mensuales.
11. **[Sistema]** Valida y guarda los egresos en la **[Base de Datos]**.
12. **[Director]** Registra saldos de cuenta bancaria.
13. **[Sistema]** Guarda los saldos en la **[Base de Datos]**.
14. **[Director]** Sube sustentos en PDF.
15. **[Sistema]** Guarda los archivos y la metadata en la **[Base de Datos]** y almacenamiento de archivos.

### Fase D: Consolidación y Envío
16. **[Director]** Revisa el consolidado trimestral.
17. **[Director]** ¿Información completa y correcta?
    - **No:** Corrige ingresos, egresos, saldos o documentos y vuelve a revisar.
    - **Sí:** Presiona el botón para cerrar el trimestre.
18. **[Sistema]** Registra el cierre, cambia el estado en la **[Base de Datos]** a **"Enviado"** y bloquea la edición del director.

### Fase E: Revisión y Auditoría
19. **[Especialista]** Revisa la lista de colegios que están en estado "Enviado".
20. **[Especialista]** Abre el detalle de una institución específica.
21. **[Sistema]** Extrae la información de la **[Base de Datos]** y muestra el resumen financiero y los PDFs.
22. **[Especialista]** Evalúa la declaración.
23. **[Especialista]** ¿Declaración correcta?
    - **Sí:** Hace clic en *"Aprobar informe"*.
      - **[Sistema]** cambia el estado en la **[Base de Datos]** a **"Aprobado"**, notifica al director.
      - **Fin**.
    - **No:** Hace clic en *"Observar informe"* e ingresa un comentario con el motivo.
      - **[Sistema]** cambia el estado en la **[Base de Datos]** a **"Observado"**, desbloquea la vista del director y le notifica.
      - **Fin / Revisión posterior**.