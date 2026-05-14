# 📝 Lista de Pendientes y Revisiones Futuras (To-Do)

Este documento sirve como hoja de ruta para verificar que el sistema funcione a la perfección en producción (la nube) y para anotar futuras mejoras.

## 🔴 Alta Prioridad (Crítico para Producción)

- [ ] **Almacenamiento de PDFs en Render:** 
  Render utiliza "discos efímeros" por defecto. Esto significa que si el servidor se reinicia, se queda inactivo o se hace un nuevo despliegue, **los PDFs subidos a la carpeta `/uploads` se borrarán**.
  *Solución recomendada:* Configurar un "Persistent Disk" (Disco Persistente) en Render o migrar la subida de archivos a un servicio en la nube como AWS S3 o Cloudinary.

- [ ] **Envío de Correos (Nodemailer):**
  Verificar que el envío de correos (para recuperación de contraseña y notificaciones al director) funcione correctamente desde el servidor de Render usando las credenciales de cPanel. A veces los proveedores de nube bloquean el puerto 465/587 por defecto.

## 🟡 Prioridad Media (Experiencia de Usuario y Pruebas)

- [ ] **Flujo de Cambio de Contraseña:**
  Probar el flujo de un "Director nuevo" que inicia sesión por primera vez con su DNI para asegurar que el sistema lo obligue a cambiar la contraseña antes de poder navegar.

- [ ] **Prueba del Flujo de Auditoría:**
  Hacer que un Director suba archivos y envíe un trimestre -> Que el Especialista lo rechaze (Observe) con un comentario -> Que el Director vea el comentario, corrija y vuelva a enviar -> Que el Especialista lo apruebe.

- [ ] **Validación de Enlaces de Descarga:**
  Asegurarse de que el visor de PDFs y el botón de descargar (`<a href={getPdfUrl(...)} download>`) en el panel del Especialista abran correctamente el archivo en la nube sin dar error `404 Not Found`.

## 🟢 Prioridad Baja (Mejoras y Pulido)

- [ ] **Dominios Personalizados:**
  Configurar un dominio propio (ej. `finanzas-ugelsanta.gob.pe`) en Vercel para el Frontend y enlazar los registros DNS.

- [ ] **Responsividad (Mobile):**
  Revisar cómo se ven las tablas del Especialista y del Director desde la pantalla de un celular.

- [ ] **Manejo de Errores Globales:**
  Implementar una página de error amigable (404 / 500) en React por si alguna ruta falla o el usuario intenta acceder a una URL que no existe.

## 🛠️ Mantenimiento

- [ ] Revisar los "Logs de Acceso" y "Auditoría" desde el perfil del Administrador en la nube para asegurar que capturan la IP real del usuario y no la IP del Load Balancer de Render.