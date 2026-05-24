import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { buildApiUrl } from '../../config/api';
import PerfilDirectorView from './perfil/PerfilDirectorView';

const InformacionGeneralView = ({ director, section = 'perfil' }) => {
  const [formData, setFormData] = useState({
    nombre_tesorero: '',
    dni_tesorero: '',
    celular_tesorero: '',
    numero_cuenta_corriente: '',
    banco: 'Banco de la Nacion',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

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
        setFormData({
          nombre_tesorero: result.data.nombre_tesorero || '',
          dni_tesorero: result.data.dni_tesorero || '',
          celular_tesorero: result.data.celular_tesorero || '',
          numero_cuenta_corriente: result.data.numero_cuenta_corriente || '',
          banco: result.data.banco || 'Banco de la Nacion',
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

    if (name === 'dni_tesorero' || name === 'celular_tesorero') {
      if (value !== '' && !/^\d+$/.test(value)) return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
      setMessage({ type: 'error', text: 'Error de conexion con el servidor.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  if (section === 'perfil') {
    return <PerfilDirectorView director={director} />;
  }

  const labelClass = 'mb-2 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400';
  const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-[15px] font-bold leading-6 text-slate-950 shadow-sm outline-none transition-all placeholder:font-semibold placeholder:text-slate-400 hover:border-blue-200 hover:shadow-md focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30';

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto space-y-8">
      {section === 'tesoreria' && (
        <div className="space-y-6">
          <div className="px-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Tesoreria</p>
          </div>

          {loading ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)]">
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] md:p-8">
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Responsable</p>
                  <h3 className="mt-1 text-xl font-black text-slate-900">Tesorero(a)</h3>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Nombre completo</label>
                    <input
                      type="text"
                      name="nombre_tesorero"
                      value={formData.nombre_tesorero}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="Nombre completo"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>DNI</label>
                    <input
                      type="text"
                      name="dni_tesorero"
                      value={formData.dni_tesorero}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="8 digitos"
                      maxLength="8"
                      inputMode="numeric"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Celular</label>
                    <input
                      type="text"
                      name="celular_tesorero"
                      value={formData.celular_tesorero}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="9 digitos"
                      maxLength="9"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] md:p-8">
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Banco</p>
                  <h3 className="mt-1 text-xl font-black text-slate-900">Cuenta corriente</h3>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Banco</label>
                    <input
                      type="text"
                      name="banco"
                      value={formData.banco}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="Banco de la Nacion"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Numero de cuenta corriente</label>
                    <input
                      type="text"
                      name="numero_cuenta_corriente"
                      value={formData.numero_cuenta_corriente}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="Numero de cuenta corriente"
                    />
                  </div>
                </div>
              </div>

              {message && (
                <div className={`rounded-lg border p-4 text-sm font-medium ${
                  message.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex justify-end rounded-[24px] border border-slate-200 bg-white px-6 py-5 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.55)]">
                <button
                  type="submit"
                  disabled={saving || !director?.id}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
                >
                  {saving ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Guardar Tesoreria
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default InformacionGeneralView;
