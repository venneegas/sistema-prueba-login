# ✅ ESTADO: COMPLETADO (ARCHIVO OBSOLETO)

> **RESUELTO:** El `LoginForm.jsx` ya está conectado al backend y valida perfectamente con la base de datos MySQL.
> Puedes eliminar este archivo con seguridad para limpiar tu espacio de trabajo.

---

## 🎬 ESCENARIO ACTUAL (SIN BACKEND)

```
┌─────────────────────────────────────┐
│   USUARIO ABRE FORMULARIO LOGIN     │
├─────────────────────────────────────┤
│ Ingresa:                            │
│  • Usuario ID: "88346"              │
│  • Contraseña: "456"                │
└────────────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ LoginForm.jsx   │
        │ (React Front)   │
        └────────┬────────┘
                 │
     ❌ NO ENVÍA AL BACKEND
                 │
                 ▼
      ┌──────────────────────┐
      │ MOCK_USERS (Local)   │
      │  "88346" encontrado  │
      └────────────┬─────────┘
                   │
                   ▼
    ✓ Login "exitoso" localmente
    ╳ BD MySQL ignorada
    ╳ directores.json NO utilizado
    ╳ login_logs NO registrado
```

---

## ✅ ESCENARIO DESEADO (CON BACKEND)

```
┌─────────────────────────────────────┐
│   USUARIO ABRE FORMULARIO LOGIN     │
├─────────────────────────────────────┤
│ Ingresa:                            │
│  • Correo: juan.perez@colegio...    │ ← CAMBIAR
│  • Contraseña: password123          │
└────────────┬────────────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ LoginForm.jsx    │
    │ (React Front)    │
    └────────┬─────────┘
             │
    ✅ POST /api/auth/login
             │
             ▼
  ┌────────────────────────────┐
  │ Backend: authController.js │
  │                            │
  │ 1. Valida credenciales    │
  │    vs directores.json      │
  └────────┬───────────────────┘
           │
           ▼
  ┌──────────────────────────────┐
  │ Busca en MySQL BD            │
  │ SELECT * FROM directores     │
  │ WHERE correo = ?             │
  └────────┬─────────────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
  EXISTE      NO EXISTE
    │             │
    │             ▼
    │      INSERT (Crear)
    │      new director
    │             │
    └──────┬──────┘
           │
           ▼
  ┌──────────────────────────────┐
  │ Registra en login_logs       │
  │ INSERT INTO login_logs       │
  └────────┬─────────────────────┘
           │
           ▼
  ✅ Devuelve datos director
     (SIN contraseña)
           │
           ▼
  Frontend recibe respuesta
  Cliente se autentica correctamente
```

---

## 📊 TABLA COMPARATIVA

| Proceso | Actual ❌ | Deseado ✅ |
|---------|----------|----------|
| **Almacenamiento** | MOCK_USERS (hardcoded) | MySQL + JSON |
| **Fuente de validación** | Frontend local | Backend/directores.json |
| **Sincronización BD** | ❌ NUNCA | ✅ Automática |
| **Auditoría (logs)** | ❌ NUNCA | ✅ En login_logs |
| **Seguridad** | ⚠️ Baja (credenciales en JS) | ✅ Alta (backend valida) |
| **Escalabilidad** | ❌ Limitada (mock) | ✅ Ilimitada (BD) |
| **Múltiples usuarios** | ❌ No | ✅ Sí |
| **Cambio de contraseña** | ❌ No implementado | ✅ Disponible |

---

## 🔧 CAMBIOS ESPECÍFICOS REQUERIDOS

### ARCHIVO: `frontend/src/components/LoginForm.jsx`

#### ❌ CÓDIGO ACTUAL (INCORRECTO)
```javascript
const handleSubmit = (e) => {
  e.preventDefault();
  
  // PROBLEMA: Busca en MOCK_USERS local
  const user = MOCK_USERS.find(u => u.id === userId && u.password === password);

  if (user) {
    onLoginSuccess(user); // Datos falsos
  } else {
    setError('Usuario o contraseña incorrectos');
  }
};
```

**Problemas:**
- ❌ No conecta a backend
- ❌ userId es "DNI" pero backend espera "correo"
- ❌ No sincroniza a BD
- ❌ No valida contra directores.json

---

#### ✅ CÓDIGO CORRECTO (RECOMENDADO)
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setError(''); // Limpiar errores previos

  try {
    // ✅ Conectar al backend
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        correo: userId,    // ← IMPORTANTE: Enviar como 'correo'
        password: password 
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // ✅ Login exitoso - usar datos del backend
      onLoginSuccess(data.director);
    } else {
      // ✅ Mostrar error del backend
      setError(data.message || 'Error en la autenticación');
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    setError('Error conectando con el servidor');
  }
};
```

**Mejoras:**
- ✅ Conecta a backend
- ✅ Envía correo (no userId)
- ✅ Sincroniza a BD
- ✅ Valida contra directores.json
- ✅ Manejo de errores robusto

---

## 📝 CAMBIO EN CAMPOS DE ENTRADA

### ACTUAL (Incorrecto)
```javascript
placeholder="DNI"
value={userId}          // Variable mal nombrada
onChange={(e) => setUserId(e.target.value)}
```

**Problema:** 
- Solicita DNI pero backend espera **correo**
- MOCK_USERS usa `id` pero directores.json usa `correo`

---

### RECOMENDADO (Correcto)
```javascript
placeholder="Correo electrónico"
value={correoEmail}     // Mejor nombre
onChange={(e) => setCorreoEmail(e.target.value)}
```

**O mejor aún:**
```javascript
// Permitir ambos y validar en backend
<input
  type="email"
  className="..."
  placeholder="Correo (ej: juan.perez@colegio.edu.pe)"
  value={userId}
  onChange={(e) => setUserId(e.target.value)}
  required
/>
```

---

## 🧪 DATOS DE PRUEBA DISPONIBLES

Una vez conectado al backend, puedes usar:

```
┌─────────────────────────────────────────┬─────────────────┐
│ Correo                                  │ Contraseña      │
├─────────────────────────────────────────┼─────────────────┤
│ juan.perez@colegio.edu.pe               │ password123     │
│ maria.garcia@colegio.edu.pe             │ password456     │
│ carlos.lopez@colegio.edu.pe             │ director123     │
└─────────────────────────────────────────┴─────────────────┘
```

Todos están en: `backend/data/directores.json`

---

## 📡 FLUJO DE DATOS (JSON)

### Request (Frontend → Backend)
```json
POST /api/auth/login

{
  "correo": "juan.perez@colegio.edu.pe",
  "password": "password123"
}
```

### Response (Backend → Frontend)
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso.",
  "director": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "correo": "juan.perez@colegio.edu.pe",
    "dni": "12345678",
    "colegio": "Colegio Nacional Jorge Chávez"
  }
}
```

### Response Error
```json
{
  "success": false,
  "message": "Correo o contraseña incorrectos."
}
```

---

## ⚙️ PASOS PARA SOLUCIONAR

### 1. Preparar Backend
```bash
cd backend
npm install    # Si no está hecho
npm start      # Debe estar en puerto 5000
```

### 2. Crear `.env` en Backend
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ugel_db
DB_USER=root
DB_PASSWORD=root
PORT=5000
NODE_ENV=development
```

### 3. Crear BD en MySQL
```bash
# En phpMyAdmin de Laragon:
# 1. New → SQL
# 2. Copiar contenido de: backend/database/schema.sql
# 3. Execute
```

### 4. Actualizar LoginForm.jsx
- Cambiar lógica de `handleSubmit`
- Cambiar campo de entrada de "DNI" a "Correo"
- Hacer POST a `http://localhost:5000/api/auth/login`

### 5. Probar
```
Credencial: juan.perez@colegio.edu.pe
Contraseña: password123

Debe:
✅ Conectarse a backend
✅ Validar contra directores.json
✅ Crear registro en BD (si es primera vez)
✅ Registrar en login_logs
✅ Devolver datos del director
```

---

## 🎯 BENEFICIOS DE HACER EL CAMBIO

| Aspecto | Actual | Después del Cambio |
|--------|--------|------------------|
| **Persistencia de datos** | ❌ No (mock) | ✅ BD MySQL |
| **Multiple usuarios** | ❌ Solo 2 | ✅ Ilimitados |
| **Auditoría** | ❌ No | ✅ Automática |
| **Cambio de contraseña** | ❌ No | ✅ Disponible |
| **Sincronización** | ❌ Manual | ✅ Automática |
| **Seguridad** | ⚠️ Baja | ✅ Alta |
| **Producción Ready** | ❌ No | ✅ Sí |

---

## ✅ RESUMEN

**El problema:** LoginForm.jsx usa MOCK_USERS en lugar de conectar al backend

**La solución:** 
1. Modificar `handleSubmit` para hacer `POST` al backend
2. Cambiar campo de entrada a "correo"
3. Usar respuesta del backend como datos de sesión

**Resultado:**
- Base de datos MySQL se sincroniza automáticamente
- Datos persistentes y seguros
- Listo para producción

---

**¿Necesitas que realice estos cambios en el código?**
