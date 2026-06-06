# ✅ ESTADO: COMPLETADO (ARCHIVO OBSOLETO)

> **RESUELTO:** El backend, las rutas y el Dashboard del Especialista ya están 100% implementados.
> Puedes eliminar este archivo con seguridad para limpiar tu espacio de trabajo.

---

## PASO 1: Crear el Controlador

Crea un nuevo archivo en tu carpeta de controladores. Este archivo se encargará de ejecutar la consulta inteligente a la base de datos.

**Ruta:** `backend/controllers/especialistaController.js`

```javascript
const db = require('../config/db'); // Ajusta la ruta si tu archivo de conexión se llama diferente

const getColegiosPorTrimestre = async (req, res) => {
  try {
    // 1. Recibir los parámetros de trimestre y año (por defecto el actual si no envían)
    const trimestre = req.query.trimestre || 1;
    const anio = req.query.anio || new Date().getFullYear();

    // 2. Consulta SQL usando LEFT JOIN y COALESCE
    const sql = `
      SELECT 
          d.id AS id,
          ie.codigo_modular AS codigoModular,
          ie.nombre_ie AS nombre,
          COALESCE(et.estado, 'Borrador') AS estado
      FROM directores d
      INNER JOIN instituciones_educativas ie ON d.institucion_id = ie.id
      LEFT JOIN estado_trimestres et 
          ON d.id = et.director_id 
          AND et.trimestre = ? 
          AND et.anio = ?
      ORDER BY ie.nombre_ie ASC
    `;

    // 3. Ejecutar la consulta pasando los parámetros
    // Nota: Dependiendo de si usas mysql2 con promises (await db.query) o callbacks, el código varía un poco.
    // Asumimos que usas mysql2/promise:
    const [rows] = await db.query(sql, [trimestre, anio]);

    // 4. Devolver la respuesta exitosa al frontend
    res.status(200).json({
      success: true,
      colegios: rows
    });

  } catch (error) {
    console.error('Error al obtener colegios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al cargar los colegios'
    });
  }
};

module.exports = {
  getColegiosPorTrimestre
};
```

---

## PASO 2: Crear el Archivo de Rutas

Ahora vamos a crear un archivo de rutas exclusivo para todas las operaciones que haga el especialista (listar, aprobar, rechazar, etc.).

**Ruta:** `backend/routes/especialistaRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const especialistaController = require('../controllers/especialistaController');

// Middleware de autenticación y roles (Opcional por ahora, pero recomendado)
// const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Ruta GET: /api/especialista/colegios
// Ejemplo de uso: /api/especialista/colegios?trimestre=1&anio=2026
router.get('/colegios', especialistaController.getColegiosPorTrimestre);

// Próximamente agregaremos aquí:
// router.post('/auditar', especialistaController.auditarDeclaracion);

module.exports = router;
```

---

## PASO 3: Registrar las Rutas en Express

Finalmente, debemos decirle a nuestro servidor principal que utilice este nuevo conjunto de rutas bajo el prefijo `/api/especialista`.

**Archivo:** `backend/server.js` (o `app.js` según lo tengas)

```javascript
// Agrega esta importación en la parte superior junto a tus otras rutas:
const especialistaRoutes = require('./routes/especialistaRoutes');

// ... [código existente del servidor] ...

// Configura el uso de la ruta (colócalo cerca de app.use('/api/auth', authRoutes))
app.use('/api/especialista', especialistaRoutes);
```

---

¡Listo! Una vez aplicados estos 3 pasos, tu servidor Node.js estará preparado para recibir peticiones en `http://localhost:5000/api/especialista/colegios` y devolverá exactamente la estructura que espera tu `EspecialistaDashboard.jsx`.