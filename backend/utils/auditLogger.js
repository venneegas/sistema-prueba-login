const { pool } = require('../config/db'); // Usamos tu conexión existente a la BD

/**
 * Registra una acción en la tabla de auditoría (auditorias)
 * 
 * @param {Object} data - Objeto con los datos de la auditoría
 * @param {number} data.usuario_id - ID del usuario (de la tabla `usuarios`) que realiza la acción
 * @param {string} data.modulo - Módulo donde ocurre la acción (ej. 'Admin', 'Sustentos PDF', 'Ingresos')
 * @param {string} data.accion - Valores permitidos: 'CREAR', 'ACTUALIZAR', 'ELIMINAR', 'CAMBIAR_PASSWORD', 'DESCARGAR'
 * @param {string} data.descripcion - Detalle legible de la acción
 * @param {string} [data.ip_address] - Dirección IP (Opcional)
 */
const logAuditoria = async ({ usuario_id, modulo, accion, descripcion, ip_address = null }) => {
    try {
        // 1. Validar que los campos obligatorios vengan en la petición
        if (!usuario_id || !modulo || !accion || !descripcion) {
            throw new Error('Faltan datos obligatorios para registrar la auditoría.');
        }

        // 2. Preparar la consulta SQL
        const sql = `
            INSERT INTO auditorias 
            (usuario_id, modulo, accion, descripcion, ip_address) 
            VALUES (?, ?, ?, ?, ?)
        `;
        
        // 3. Ejecutar la inserción en la base de datos
        await pool.execute(sql, [usuario_id, modulo, accion, descripcion, ip_address]);
        
    } catch (error) {
        // Solo imprimimos el error en consola para alertar al desarrollador.
        // No lanzamos (throw) el error para evitar que la acción principal del usuario fracase.
        console.error('❌ Error al guardar en auditorias:', error.message);
    }
};

module.exports = { logAuditoria };