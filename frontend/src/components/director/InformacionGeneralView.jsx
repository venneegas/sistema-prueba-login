import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { buildApiUrl } from '../../config/api';

const obtenerNombreCompleto = (director) => {
  const partes = [
    director?.nombres,
    director?.apellido_paterno,
    director?.apellido_materno,
  ].filter(Boolean);

  return partes.length > 0 ? partes.join(' ') : 'No disponible';
};

const InformacionGeneralView = ({ director }) => {
  const [formData, setFormData] = useState({
    nombre_tesorero: '',
    dni_tesorero: '',
    celular_tesorero: '',
    numero_cuenta_corriente: '',
    banco: 'Banco de la Nación'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Efecto para cargar los datos del backend al abrir la pantalla
  useEffect(() => {
    if (director?.id) {
      fetchDatos();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [director]);

  const fetchDatos = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(`/api/datos-institucionales/${director.id}`));
      const result = await response.json();
      
      if (result.success && result.data) {
        // Si el backend devuelve datos, poblamos el formulario
        setFormData({
          nombre_tesorero: result.data.nombre_tesorero || '',
          dni_tesorero: result.data.dni_tesorero || '',
          celular_tesorero: result.data.celular_tesorero || '',
          numero_cuenta_corriente: result.data.numero_cuenta_corriente || '',
          banco: result.data.banco || 'Banco de la Nación'
        });
      }
    } catch (error) {
      console.error('Error al cargar datos institucionales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Validación estricta para que DNI y celular solo acepten números
    if (name === 'dni_tesorero' || name === 'celular_tesorero') {
      if (value !== '' && !/^\d+$/.test(value)) {
        return; // Ignorar el cambio si se ingresa algo que no es un dígito
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(buildApiUrl(`/api/datos-institucionales/${director.id}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Datos guardados correctamente.' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Error al guardar los datos.' });
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      setMessage({ type: 'error', text: 'Error de conexión con el servidor.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000); // Ocultar alerta después de 4s
    }
  };

  const datosDirector = [
    { label: 'Director(a)', value: obtenerNombreCompleto(director) },
    { label: 'DNI', value: director?.dni || 'No disponible' },
    { label: 'Celular', value: director?.celular || 'No disponible' },
    { label: 'Correo', value: director?.email || director?.correo || 'No disponible' },
  ];

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto space-y-8">
      {/* 1. Tarjeta de Datos del Director (Solo Lectura) */}
      <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] border border-slate-200">
        <h2 className="text-xl font-bold text-gray-800 mb-2">DATOS DEL DIRECTOR</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {datosDirector.map((item) => (
            <div key={item.label} className="rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white px-5 py-4 shadow-sm hover:shadow-md transition-all">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{item.label}</p>
              <p className="text-base font-semibold text-gray-800 mt-1 break-words">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Tarjeta de Datos del Comité (Formulario) */}
      <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] border border-slate-200">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">DATOS DEL TESORERO(A)</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo</label>
                <input
                  type="text"
                  name="nombre_tesorero"
                  value={formData.nombre_tesorero}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400 bg-white"
                  placeholder="Nombre completo"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">DNI</label>
                <input
                  type="text"
                  name="dni_tesorero"
                  value={formData.dni_tesorero}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400 bg-white"
                  placeholder="8 dígitos"
                  maxLength="8"
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Celular</label>
                <input
                  type="text"
                  name="celular_tesorero"
                  value={formData.celular_tesorero}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400 bg-white"
                  placeholder="9 dígitos"
                  maxLength="9"
                  inputMode="numeric"
                />
              </div>

            </div>

            {/* Alertas dinámicas */}
            {message && (
              <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.text}
              </div>
            )}

            <div className="flex justify-end pt-6 border-t border-gray-100 mt-8">
              <button
                type="submit"
                disabled={saving || !director?.id}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Guardar Información
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. Tarjeta de Cuenta Corriente */}
      <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] border border-slate-200">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">CUENTA CORRIENTE - BANCO DE LA NACION</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="max-w-xl">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Número</label>
              <input
                type="text"
                name="numero_cuenta_corriente"
                value={formData.numero_cuenta_corriente}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400 bg-white"
                placeholder="Número de cuenta corriente"
              />
            </div>

            {message && (
              <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.text}
              </div>
            )}

            <div className="flex justify-end pt-6 border-t border-gray-100 mt-8">
              <button
                type="submit"
                disabled={saving || !director?.id}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default InformacionGeneralView;
