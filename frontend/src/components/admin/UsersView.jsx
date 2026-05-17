import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit, Trash2, Shield, User, ShieldCheck, RefreshCw, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { buildApiUrl } from '../../config/api';

const UsersView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Estados para el Modal
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', apellido: '', dni: '', colegio: '', email: '', password: '', rol: 'especialista' });
  const [initialFormData, setInitialFormData] = useState(null); // NUEVO: Para detectar cambios sin guardar
  const [showConfirmDialog, setShowConfirmDialog] = useState(false); // NUEVO: Estado para el modal de confirmación
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); // NUEVO: Estado para el Toast

  useEffect(() => {
    // Obtener el ID del usuario activo desde el token JWT
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id);
      } catch (e) {}
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/api/admin/usuarios'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.message || 'Error al cargar los usuarios.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al servidor.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.nombre && u.nombre.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.colegio && u.colegio.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'todos' || u.rol === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Calcular paginación
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedUsers = filteredUsers.slice(startIndex, endIndex);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, itemsPerPage]);

  // Auto-ocultar el toast después de 3 segundos
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Cerrar modal/panel lateral con la tecla Escape y bloquear scroll del body
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showConfirmDialog) {
          setShowConfirmDialog(false); // Si la alerta está abierta, el Escape solo cierra la alerta
          return;
        }
        const isDirty = initialFormData && JSON.stringify(formData) !== JSON.stringify(initialFormData);
        if (isDirty) {
          setShowConfirmDialog(true);
        } else {
          setShowModal(false);
        }
      }
    };

    if (showModal) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Bloquea el scroll del fondo
    } else {
      document.body.style.overflow = 'unset'; // Restaura el scroll si se cierra
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset'; // Restaura el scroll si el componente se desmonta
    };
  }, [showModal, formData, initialFormData, showConfirmDialog]);

  // NUEVO: Función centralizada para cerrar el modal verificando cambios
  const handleCloseModal = () => {
    const isDirty = initialFormData && JSON.stringify(formData) !== JSON.stringify(initialFormData);
    if (isDirty) {
      setShowConfirmDialog(true);
    } else {
      setShowModal(false);
    }
  };

  // Manejar el envío del formulario (Crear o Editar)
  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const method = editingUserId ? 'PUT' : 'POST';
      const endpoint = editingUserId ? `/api/admin/usuarios/${editingUserId}` : '/api/admin/usuarios';
      
      const response = await fetch(buildApiUrl(endpoint), {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      // Verificación de seguridad para evitar que crashee si el backend devuelve HTML (ej. un 404)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("La ruta no existe en el servidor. Por favor, reinicia tu consola del backend.");
      }

      const data = await response.json();

      if (data.success) {
        setShowModal(false);
        setEditingUserId(null);
        setFormData({ nombre: '', apellido: '', dni: '', colegio: '', email: '', password: '', rol: 'especialista' }); // resetear form
        fetchUsers(); // Recargar la tabla
        showToast(editingUserId ? 'Usuario actualizado exitosamente.' : 'Usuario creado exitosamente.');
      } else {
        setModalError(data.message || 'Error al guardar el usuario.');
      }
    } catch (err) {
      console.error(err);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setModalError('Error de red: El servidor backend parece estar apagado.');
      } else {
        setModalError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar la eliminación o suspensión del usuario
  const handleDeleteUser = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar o suspender a este usuario?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/api/admin/usuarios/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        fetchUsers();
        showToast('Usuario eliminado o suspendido exitosamente.');
      } else {
        showToast(data.message || 'Error al procesar la solicitud.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de red al intentar comunicarse con el servidor.', 'error');
    }
  };

  const getRoleBadge = (rol) => {
    switch (rol) {
      case 'admin':
        return <span className="flex items-center gap-1.5 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-200"><ShieldCheck size={14}/> Admin</span>;
      case 'especialista':
        return <span className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200"><Shield size={14}/> Especialista</span>;
      case 'director':
        return <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200"><User size={14}/> Director</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">{rol}</span>;
    }
  };

  if (loading) return <div className="flex-1 flex justify-center items-center p-8 text-slate-500 font-medium">Cargando usuarios...</div>;
  if (error) return <div className="flex-1 flex justify-center items-center p-8 text-rose-500 font-bold">{error}</div>;

  return (
    <>
      <header className="bg-white shadow-sm px-8 py-5 flex items-center justify-between z-10 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Users className="text-blue-600" size={28} />
          Gestión de Usuarios
        </h1>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchUsers} 
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            onClick={() => {
              const defaultForm = { nombre: '', apellido: '', dni: '', colegio: '', email: '', password: '', rol: 'especialista' };
              setEditingUserId(null);
              setFormData(defaultForm);
              setInitialFormData(defaultForm);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm"
          >
            <Plus size={18} />
            Nuevo Usuario
          </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Barra de herramientas */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nombre, correo o colegio..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <select 
                className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="todos">Todos los Roles</option>
                <option value="admin">Administradores</option>
                <option value="especialista">Especialistas</option>
                <option value="director">Directores</option>
              </select>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                <select 
                  className="bg-transparent text-slate-700 text-sm font-medium outline-none"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-slate-500 text-sm font-medium">de {filteredUsers.length}</span>
              </div>
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold">Usuario</th>
                    <th className="p-4 font-bold">Rol</th>
                    <th className="p-4 font-bold">Institución Asignada</th>
                    <th className="p-4 font-bold text-center">Estado</th>
                    <th className="p-4 font-bold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500 font-medium">No se encontraron usuarios que coincidan con los filtros.</td>
                    </tr>
                  ) : (
                    displayedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{u.nombre}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                        </td>
                        <td className="p-4">
                          {getRoleBadge(u.rol)}
                        </td>
                        <td className="p-4 text-sm text-slate-600 font-medium">
                          {u.colegio}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${u.estado === 'activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {u.estado === 'activo' ? 'Activo' : 'Suspendido'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingUserId(u.id);
                              const editForm = { 
                                nombre: u.nombre || '', 
                                apellido: u.apellido || '', 
                                dni: u.dni || '', 
                                colegio: u.colegio || '', 
                                email: u.email || '', 
                                password: '', 
                                rol: u.rol || 'especialista' 
                              };
                              setFormData(editForm);
                              setInitialFormData(editForm);
                                setShowModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar Usuario">
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={currentUserId === u.id}
                              className={`p-2 rounded-lg transition-colors ${currentUserId === u.id ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`} 
                              title={currentUserId === u.id ? "No puedes eliminar tu propia cuenta" : "Suspender/Eliminar"}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Controles de paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="text-sm text-slate-600 font-medium">
                  Mostrando <span className="font-bold">{startIndex + 1}</span> a <span className="font-bold">{Math.min(endIndex, filteredUsers.length)}</span> de <span className="font-bold">{filteredUsers.length}</span> usuarios
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-colors ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:text-blue-600 border border-slate-200'}`}
                    title="Página anterior"
                  >
                    ←
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[40px] h-10 rounded-lg font-bold transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-colors ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:text-blue-600 border border-slate-200'}`}
                    title="Próxima página"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel Lateral (Drawer) para Crear/Editar Usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Fondo oscuro desenfocado */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={handleCloseModal}
          ></div>

          {/* Contenedor del panel lateral */}
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 h-full">
            
            {/* Cabecera del Panel */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">
                {editingUserId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo del Formulario Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <form id="user-drawer-form" onSubmit={handleSubmitUser} className="p-6 space-y-6">
                {modalError && (
                  <div className="p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm font-medium">
                    {modalError}
                  </div>
                )}

                {/* Selector de Rol siempre arriba */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Rol de Sistema</label>
                  <select required
                    value={formData.rol} onChange={(e) => setFormData({...formData, rol: e.target.value})}
                    className="w-full px-4 py-2.5 bg-blue-50/50 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all font-bold text-blue-700">
                    <option value="especialista">Especialista UGEL</option>
                    <option value="admin">Administrador (TI)</option>
                    <option value="director">Director de I.E.</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Datos Personales
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Nombre(s)</label>
                    <input type="text" required
                      value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                      placeholder={formData.rol === 'director' ? "Ej. Juan Luis" : "Ej. Ana María López"} />
                  </div>

                  {formData.rol === 'director' && (
                    <>
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Apellidos</label>
                        <input type="text" required={formData.rol === 'director'}
                          value={formData.apellido} onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                          placeholder="Ej. Pérez Silva" />
                      </div>
                      
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">DNI</label>
                        <input type="text" required={formData.rol === 'director'} maxLength="8" pattern="\d{8}"
                          value={formData.dni} onChange={(e) => setFormData({...formData, dni: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                          placeholder="8 dígitos" />
                      </div>

                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Institución Educativa (Colegio)</label>
                        <input type="text" required={formData.rol === 'director'}
                          value={formData.colegio} onChange={(e) => setFormData({...formData, colegio: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                          placeholder="Ej. I.E. Jorge Chávez" />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Credenciales de Acceso
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Correo Electrónico (Usuario)</label>
                    <input type="email" required
                      value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                      placeholder="correo@ugel.edu.pe" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      {editingUserId ? 'Nueva Contraseña (Opcional)' : 'Contraseña Temporal'}
                    </label>
                    <input type="password" required={!editingUserId} minLength="6"
                      value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                      placeholder={editingUserId ? "Dejar en blanco para no cambiar" : "Mínimo 6 caracteres"} />
                  </div>
                </div>
              </form>
            </div>

            {/* Pie del Panel - Botones fijos abajo */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 mt-auto shrink-0">
              <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-3 text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 font-bold rounded-xl transition-colors shadow-sm">
                Cancelar
              </button>
              <button type="submit" form="user-drawer-form" disabled={isSubmitting} className="flex-1 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 font-bold rounded-xl transition-colors disabled:opacity-50 shadow-sm">
                {isSubmitting ? 'Guardando...' : (editingUserId ? 'Actualizar Usuario' : 'Crear Usuario')}
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Modal Personalizado de Confirmación (Reemplazo de window.confirm) */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Fondo oscuro extra para resaltar la alerta */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowConfirmDialog(false)}
          ></div>
          
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">¿Descartar cambios?</h3>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              Tienes cambios sin guardar. Si cierras ahora, se perderá la información que has modificado.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition-colors text-sm"
              >
                Continuar editando
              </button>
              <button 
                onClick={() => {
                  setShowConfirmDialog(false);
                  setShowModal(false);
                }}
                className="flex-1 px-4 py-2.5 text-white bg-rose-600 hover:bg-rose-700 font-bold rounded-xl transition-colors text-sm shadow-sm"
              >
                Sí, descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[70] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-bold text-white ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            {toast.message}
          </div>
        </div>
      )}
    </>
  );
};

export default UsersView;