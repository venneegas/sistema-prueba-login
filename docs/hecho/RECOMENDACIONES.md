# Recomendaciones Y Siguientes Pasos

Este documento lista mejoras pendientes o puntos de vigilancia. No incluye funcionalidades que ya fueron completadas.

## 1. Almacenamiento Persistente De Archivos

Los PDFs subidos por los directores ya se guardan de forma real con `multer` y se registran en la tabla `sustentos`. El riesgo actual esta en produccion: si Render usa disco efimero, los archivos pueden perderse tras reinicios o redeploys.

Recomendacion:

- Configurar Persistent Disk en Render, o
- Migrar PDFs a almacenamiento externo como S3, Cloudinary u otro servicio equivalente.

## 2. Reportes Administrativos

El panel de Especialista ya cuenta con reporte global basado en datos reales. El panel Admin debe evitar vistas con informacion simulada y consumir endpoints reales para reportes institucionales.

Recomendacion:

- Reutilizar `/api/especialista/reporte-global` cuando el reporte sea financiero.
- Crear rutas admin propias si se necesitan filtros o formatos diferentes.

## 3. Auditoria En Produccion

El sistema registra sesiones y acciones relevantes. En produccion se debe validar que la IP registrada corresponda al usuario final y no solo al proxy o load balancer.

Recomendacion:

- Revisar `trust proxy` en Express si Render entrega IP por cabeceras.
- Verificar registros reales en `sesiones` y `auditorias`.

## 4. Mantenimiento De Catalogos

Los tipos de comprobante ya se administran desde la tabla `comprobantes`. Para mantener consistencia:

- Ingresos debe usar `Recibo Interno` y `Voucher Banco`.
- Egresos debe usar el catalogo activo, excluyendo comprobantes deshabilitados.
- `Boleta Venta Electronica` debe quedar como denominacion unificada.

## 5. Limpieza De Schema

Algunas columnas pueden quedar como legado si la interfaz ya no usa la funcionalidad asociada.

Puntos a revisar antes de eliminar columnas:

- `movimientos.color`: antes permitia colorear filas.
- `perfil.foto_director` y `perfil.escudo_colegio`: antes permitian subir imagenes.

No eliminar columnas en produccion sin migracion controlada y respaldo previo.

## 6. Pruebas De Flujo Completo

Probar el ciclo real:

1. Director registra ingresos, egresos, saldos y PDFs.
2. Director cierra trimestre.
3. Especialista observa con comentario.
4. Director corrige y vuelve a cerrar.
5. Especialista aprueba.
6. Admin revisa auditoria, sesiones y respaldo.
