import React, { useState } from 'react';
import { UserMinus, Send, X, AlertCircle } from 'lucide-react';
import { buildApiUrl } from '../../config/api';

const SolicitudReemplazoModal = ({ isOpen, onClose, director }) => {
  const [motivo, setMotivo] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMensaje('');

    // Validación estricta del formato del correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nuevoCorreo)) {
      setError('Por favor, ingresa un formato de correo electrónico válido (ej: usuario@correo.com).');
      setLoading(false);
      return;
    }

    try {
      // Lógica de conexión con el backend
      const response = await fetch(buildApiUrl('/api/solicitudes-reemplazo'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          directorId: director?.id,
          school: director?.school,
          motivo,
          nuevoCorreo,
          telefono
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMensaje('Solicitud enviada correctamente al especialista.');
        setTimeout(() => resetAndClose(), 2500);
      } else {
        throw new Error(data.message || 'Error al enviar la solicitud.');
      }
    } catch (err) {
      setError(err.message || 'Error conectando con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    onClose();
    setMensaje('');
    setError('');
    setMotivo('');
    setNuevoCorreo('');
    setTelefono('');
  };

  const inputClass = "w-full rounded-xl border border-slate-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm";

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl shadow-sm border border-blue-200">
              <UserMinus size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Reemplazo de Director</h3>
          </div>
          <button onClick={resetAndClose} className="text-slate-400 hover:bg-slate-200 hover:text-slate-600 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">
              Completa este formulario si el director anterior ha cesado. La solicitud será evaluada por el especialista de la UGEL, quien emitirá las nuevas credenciales.
            </p>
          </div>

          {mensaje && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-bold">{mensaje}</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Motivo del Reemplazo *</label>
              <textarea
                required
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. El director fue trasladado. Asumo temporalmente..."
                className={`${inputClass} resize-none h-24`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Correo del Nuevo Responsable *</label>
              <input type="email" required value={nuevoCorreo} onChange={(e) => setNuevoCorreo(e.target.value)} placeholder="correo@ejemplo.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Celular de Contacto *</label>
              <input 
                type="tel" 
                required 
                value={telefono} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d+$/.test(val)) setTelefono(val);
                }} 
                placeholder="9 dígitos" 
                maxLength="9" 
                className={inputClass} 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={resetAndClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors flex items-center gap-2 disabled:bg-slate-400">
              <Send size={16} />
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default SolicitudReemplazoModal;
