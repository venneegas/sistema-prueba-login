# Preguntas y Respuestas sobre Codigo y Repositorio

Este documento contiene posibles preguntas de sustentacion relacionadas con modificaciones de codigo, uso del repositorio y explicacion de archivos importantes del sistema.

## Si Piden Modificar Codigo

### Que pasa si me dicen que modifique algo del codigo?

Normalmente no esperan una modificacion grande en vivo. Quieren comprobar si entiendes tu proyecto, si sabes ubicar archivos, si puedes hacer un cambio pequeno sin romper el sistema y si sabes explicar el impacto.

Una buena respuesta seria:

> Si, el proyecto esta versionado en el repositorio. Puedo hacer la modificacion en una rama o localmente, probarla y luego subirla con un commit. Lo importante es no modificar directamente produccion sin validar.

### Que responder si dicen que todo ya esta subido al repositorio?

Que el proyecto este subido al repositorio no impide modificarlo. El repositorio sirve justamente para controlar versiones.

Respuesta recomendada:

> Que este subido al repositorio no impide modificarlo. Se puede crear un nuevo commit con el cambio, o una rama si quiero separar la modificacion y revisarla antes de unirla a la rama principal.

## Cambios Pequenos que Podrian Pedir

### 1. Cambiar un texto del frontend

Por ejemplo, modificar un titulo, boton o mensaje de error.

### 2. Agregar una validacion

Por ejemplo, impedir que se registre un monto negativo.

### 3. Cambiar o explicar un endpoint

Por ejemplo, explicar donde se consulta `/api/especialista/ml/isolation-forest`.

### 4. Modificar una regla de negocio

Por ejemplo, indicar que un reporte aprobado ya no pueda editarse.

### 5. Agregar un campo a una tabla o formulario

En este caso se debe explicar que el cambio podria afectar frontend, backend, base de datos y validaciones.

### 6. Cambiar el nivel de riesgo del modelo ML

En el archivo `backend/ml/isolation_forest.py` se encuentra una linea similar a:

```python
risk_level = "alta" if risk_score >= 75 else "media" if risk_score >= 50 else "baja"
```

Explicacion recomendada:

> Aqui clasifico el riesgo segun el puntaje normalizado. Si el puntaje es mayor o igual a 75, es alta; si es mayor o igual a 50, media; si no, baja. Si el jurado pide otro criterio, puedo cambiar esos umbrales.

## Preguntas sobre el Codigo

### 1. Donde empieza el backend?

El backend empieza en `backend/server.js`. Ahi se configura Express, CORS, Helmet, rate limit, rutas y servidor.

### 2. Donde estan las rutas?

Las rutas estan en `backend/routes/`. Por ejemplo, las rutas del especialista estan en `backend/routes/especialistaRoutes.js`.

### 3. Donde esta la logica de negocio?

La logica de negocio esta en `backend/controllers/`. Por ejemplo, la logica del especialista esta en `backend/controllers/especialistaController.js`.

### 4. Donde se conecta a la base de datos?

La conexion a la base de datos esta en `backend/config/db.js`.

### 5. Donde se valida el token?

El token se valida en `backend/middlewares/authMiddleware.js`.

### 6. Donde esta el modelo de Machine Learning?

El modelo de Machine Learning esta en `backend/ml/isolation_forest.py`.

### 7. Donde estan las pantallas del frontend?

Las pantallas estan en `frontend/src/components/`, separadas por rol:

- `admin`.
- `director`.
- `especialista`.

### 8. Donde se configura la URL de la API?

La URL de la API se configura en `frontend/src/config/api.js`.

### 9. Donde estan los estilos?

Los estilos estan en archivos como:

- `frontend/src/index.css`.
- `frontend/src/App.css`.
- `frontend/tailwind.config.js`.

### 10. Donde se suben los PDFs?

Los PDFs se manejan en backend con Multer y se guardan en `backend/uploads/pdfs`. Sus metadatos se registran en la base de datos.

## Preguntas Trampa sobre Codigo

### 1. Si cambio algo en React, ya queda cambiado en la base de datos?

No. React solo cambia la interfaz. Para guardar datos, debe llamar al backend, y el backend debe persistir la informacion en MySQL.

### 2. Si modifico una tabla en MySQL, el frontend se actualiza solo?

No necesariamente. Tambien debo ajustar backend, consultas SQL y posiblemente el frontend.

### 3. Si una ruta esta protegida en el frontend, ya es segura?

No. La seguridad real debe estar en el backend con JWT y validacion de permisos.

### 4. Por que tienes rutas y controladores separados?

Para mantener el codigo ordenado. Las rutas definen los endpoints y los controladores contienen la logica.

### 5. Por que usas variables de entorno?

Para no exponer credenciales, claves JWT, conexion a base de datos o configuracion sensible dentro del codigo.

### 6. Que pasa si alguien manda una peticion directamente desde Postman?

El backend debe validar el token, los permisos y los datos. No debe depender del frontend.

### 7. Que pasa si el modelo de ML falla?

El backend debe manejar el error y devolver una respuesta clara. Ademas, el sistema principal puede seguir funcionando sin depender totalmente del modelo.

### 8. Por que el archivo de ML esta en Python si tu backend es Node.js?

Porque Python tiene librerias fuertes para Machine Learning, como `scikit-learn`. Node.js puede ejecutar o comunicarse con ese script para obtener resultados.

### 9. El codigo esta listo para produccion?

Respuesta recomendada:

> Tiene una estructura funcional para despliegue, pero como todo sistema real puede mejorar con mas pruebas automatizadas, monitoreo, backups, almacenamiento persistente para PDFs y control mas fino de permisos.

## Si No Sabes Modificar Algo en Vivo

No conviene responder "no se". Es mejor explicar el metodo:

> Primero ubicaria el modulo responsable. Si es interfaz, reviso el componente en React. Si es logica o datos, reviso la ruta, controlador y consulta en backend. Luego hago el cambio, lo pruebo localmente y lo subo al repositorio con un commit.

## Respuesta Recomendada bajo Presion

> Como el sistema esta versionado en Git, cualquier cambio debe hacerse de forma controlada. Primero identifico si el cambio pertenece al frontend, backend, base de datos o modelo ML. Luego modifico el archivo correspondiente, pruebo el flujo afectado y finalmente genero un commit. Asi puedo revertir o comparar cambios si algo falla.

## Explicacion del Archivo isolation_forest.py

Si preguntan especificamente por `backend/ml/isolation_forest.py`, puedes decir:

> Este archivo recibe datos financieros en formato JSON, convierte las variables en una matriz numerica, entrena un Isolation Forest, calcula puntajes de anomalia, clasifica el riesgo y devuelve alertas ordenadas. No decide fraude; solo prioriza casos atipicos para revision del especialista.
