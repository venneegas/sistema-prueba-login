# 🚀 Guía de Despliegue del Sistema UGEL

Este documento detalla todos los requisitos técnicos, la configuración del entorno y los pasos necesarios para desplegar el sistema web (Frontend, Backend y Base de Datos) en un servidor de producción.

## 1. Arquitectura General

El sistema tiene una arquitectura cliente-servidor desacoplada:

- **Frontend:** Una aplicación de **React** (Single Page Application) que se encarga de la interfaz de usuario.
- **Backend:** Una **API REST** desarrollada en **Node.js con Express** que maneja la lógica de negocio, la seguridad y la comunicación con la base de datos.
- **Base de Datos:** Un servidor **MySQL** para la persistencia de datos estructurados.
- **Módulo de Machine Learning:** Un script de **Python** que es ejecutado por el backend para el análisis de anomalías.

```text
Usuario -> Navegador Web -> [Frontend React] <-> [Backend Node.js] <-> [Base de Datos MySQL]
                                                     |
                                                     V
                                                 [Script Python]
```

---

## 2. Requisitos del Servidor (Infraestructura)

Antes de desplegar, es necesario coordinar con el equipo de TI de la entidad para asegurar que el servidor cumple con los siguientes requisitos.

### Software Principal:
| Componente | Software Requerido | Versión Recomendada | Propósito |
| :--- | :--- | :--- | :--- |
| **Sistema Operativo** | Linux (Ubuntu, CentOS) | Ubuntu 22.04 LTS | Entorno de servidor estándar y estable. |
| **Backend Runtime** | Node.js | 18.x LTS o superior | Para ejecutar la aplicación de Express. |
| **Gestor de Procesos**| PM2 | Última versión | Mantiene el backend corriendo 24/7 y lo reinicia si falla. |
| **ML Runtime** | Python | 3.9 o superior | Para ejecutar el script de `isolation_forest.py`. |
| **Servidor Web** | Nginx (preferido) o Apache | Última versión | Servir el frontend de React y actuar como proxy inverso para el backend. |
| **Base de Datos** | Servidor MySQL | 8.0 o superior | Almacenar todos los datos de la aplicación. |

### Configuración de Red y Seguridad:
- **Firewall:** Deben estar abiertos los siguientes puertos:
  - `80 (HTTP)`: Para el acceso web estándar.
  - `443 (HTTPS)`: Para el acceso web seguro (requiere un certificado SSL).
  - `5000` (o el puerto elegido): Para que el backend de Node.js pueda ejecutarse. Nginx redirigirá el tráfico del puerto 80/443 a este.
- **Acceso al Servidor:** Se necesita acceso vía **SSH** para poder ejecutar comandos, configurar el entorno y desplegar los archivos. El acceso por FTP es limitado y no es suficiente.

---

## 3. Pasos para el Despliegue

### Paso 1: Preparación del Backend (Node.js)

1.  **Subir el Código:** Copia la carpeta `backend` completa al servidor, por ejemplo, en `/var/www/ugel-api`.
2.  **Crear el Archivo de Entorno (`.env`):** Dentro de `/var/www/ugel-api`, crea un archivo llamado `.env`. Este es el paso más crítico, ya que contiene todas las credenciales y configuraciones.
    ```ini
    # Puerto para el servidor de Node.js
    PORT=5000

    # Credenciales de la Base de Datos MySQL de la UGEL
    DB_HOST=localhost
    DB_USER=usuario_creado_para_la_app
    DB_PASSWORD=contraseña_segura_de_la_bd
    DB_DATABASE=nombre_de_la_bd_ugel
    DB_PORT=3306

    # Clave secreta para firmar los tokens JWT (debe ser larga y aleatoria)
    JWT_SECRET=una_frase_muy_larga_y_secreta_generada_para_produccion_2026

    # Credenciales del correo institucional para Nodemailer (recuperación de contraseña)
    EMAIL_HOST=mail.ugelsanta.gob.pe
    EMAIL_PORT=465
    EMAIL_SECURE=true
    EMAIL_USER=correo_institucional@ugelsanta.gob.pe
    EMAIL_PASS=contraseña_del_correo
    ```
3.  **Instalar Dependencias:** En la terminal del servidor, dentro de la carpeta `/var/www/ugel-api`, ejecuta:
    ```bash
    npm install --production
    ```
4.  **Instalar Dependencias de Python:**
    ```bash
    pip install -r ml/requirements.txt
    ```
5.  **Iniciar con PM2:** Para que el backend se ejecute de forma persistente:
    ```bash
    pm2 start server.js --name "ugel-api"
    pm2 save
    pm2 startup
    ```

### Paso 2: Preparación de la Base de Datos (MySQL)

1.  **Exportar Datos:** Desde tu base de datos actual (Aiven), exporta toda la estructura y los datos a un archivo `.sql`.
2.  **Importar Datos:** El administrador de TI de la UGEL debe crear una base de datos y un usuario (con los datos que pusiste en el `.env`) y luego importar el archivo `.sql` en el nuevo servidor.

### Paso 3: Preparación del Frontend (React)

1.  **Generar Archivos de Producción:** En tu máquina local, dentro de la carpeta `frontend`, ejecuta:
    ```bash
    npm run build
    ```
    Esto creará una carpeta `build` (o `dist`) con los archivos estáticos (HTML, CSS, JS).
2.  **Subir Archivos Estáticos:** Copia **el contenido** de la carpeta `frontend/build` al directorio raíz del servidor web en el servidor, por ejemplo, a `/var/www/html`.

### Paso 4: Configuración del Servidor Web (Nginx)

Nginx actuará como intermediario. Su función es:
1.  Servir los archivos del frontend de React.
2.  Redirigir todas las peticiones a la API (ej. `/api/...`) hacia el backend de Node.js que corre en el puerto 5000.

Crea un archivo de configuración para Nginx en `/etc/nginx/sites-available/ugel`:

```nginx
server {
    listen 80;
    server_name sistema-ugel.gob.pe; # Reemplazar con el dominio real

    # Raíz donde están los archivos del frontend
    root /var/www/html;
    index index.html;

    # Redirigir peticiones a la API hacia el backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # "Catch-all" para que el enrutamiento de React funcione
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Finalmente, activa la configuración y reinicia Nginx.

---

## 4. Requisito Crítico: Almacenamiento de Archivos (PDFs y Fotos)

**Problema:** El código actual guarda los archivos subidos (PDFs de sustentos, fotos de perfil) en una carpeta local del backend (`/uploads`). En muchos proveedores de hosting (como Render o Heroku) y en configuraciones de contenedores, este sistema de archivos es **efímero**, lo que significa que **los archivos se borrarán** si el servidor se reinicia o se redespliega.

**Solución para Producción:**
1.  **Disco Persistente:** La solución más directa en un VPS o servidor propio es asegurarse de que el directorio `/uploads` esté en un volumen de almacenamiento persistente.
2.  **Servicio de Almacenamiento Externo (Recomendado):** La mejor práctica es modificar el código para subir los archivos a un servicio de almacenamiento en la nube como **Amazon S3**, **Google Cloud Storage** o **Cloudinary**. Esto desacopla los archivos de la vida del servidor, facilita los backups y mejora la escalabilidad.

> **Advertencia:** Antes del despliegue final, es fundamental abordar este punto para evitar la pérdida de los documentos de sustento, que son una parte vital del sistema.