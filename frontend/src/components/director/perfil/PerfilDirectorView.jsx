import React, { useEffect, useState } from 'react';
import { UserRound, Pencil, Save, X } from 'lucide-react';
import API_BASE_URL, { buildApiUrl } from '../../../config/api';

const obtenerNombreCompleto = (director) => {
  const partes = [
    director?.nombres,
    director?.apellido_paterno,
    director?.apellido_materno,
  ].filter(Boolean);

  return partes.length > 0 ? partes.join(' ') : 'No disponible';
};

const buildAssetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

const PerfilDirectorView = ({ director, onProfileUpdate }) => {
  const [perfil, setPerfil] = useState({
    foto_director: null,
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    dni: '',
    celular: '',
    email: '',
    ruc: '',
  });

  useEffect(() => {
    const fetchPerfil = async () => {
      if (!director?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(buildApiUrl(`/api/perfil/${director.id}`), {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const result = await response.json();

        if (response.ok && result.success) {
          setPerfil({
            foto_director: result.data?.foto_director || null,
          });
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, [director?.id]);

  useEffect(() => {
    setFormData({
      dni: director?.dni || '',
      celular: director?.celular || '',
      email: director?.email || director?.correo || '',
      ruc: director?.ruc || director?.ruc_ie || director?.institucion_ruc || '',
    });
  }, [director]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if ((name === 'dni' || name === 'celular' || name === 'ruc') && value !== '' && !/^\d+$/.test(value)) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(buildApiUrl(`/api/perfil/${director.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const updatedDirector = {
          ...director,
          dni: result.data?.dni ?? formData.dni,
          celular: result.data?.celular ?? formData.celular,
          email: result.data?.email ?? formData.email,
          ruc: result.data?.ruc ?? formData.ruc,
        };

        setFormData({
          dni: updatedDirector.dni || '',
          celular: updatedDirector.celular || '',
          email: updatedDirector.email || '',
          ruc: updatedDirector.ruc || '',
        });
        setEditMode(false);
        setMessage({ type: 'success', text: result.message || 'Datos actualizados correctamente.' });
        onProfileUpdate?.(updatedDirector);
      } else {
        setMessage({ type: 'error', text: result.message || 'No se pudieron guardar los cambios.' });
      }
    } catch (error) {
      console.error('Error al actualizar datos del director:', error);
      setMessage({ type: 'error', text: 'Error de conexión con el servidor.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      dni: director?.dni || '',
      celular: director?.celular || '',
      email: director?.email || director?.correo || '',
      ruc: director?.ruc || director?.ruc_ie || director?.institucion_ruc || '',
    });
    setMessage(null);
    setEditMode(false);
  };

  const datosDirector = [
    { label: 'DNI', value: director?.dni || 'No disponible' },
    { label: 'Celular', value: director?.celular || 'No disponible' },
    { label: 'Correo', value: director?.email || director?.correo || 'No disponible' },
    { label: 'RUC', value: director?.ruc || director?.ruc_ie || director?.institucion_ruc || 'No registrado' },
  ];

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto space-y-8">
      <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] border border-slate-200 dark:border-slate-700 dark:bg-slate-800/95">
        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:border-slate-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-blue-100 text-blue-700 shadow-lg dark:border-slate-700 dark:bg-blue-500/10 dark:text-blue-300">
                {perfil.foto_director ? (
                  <img src={buildAssetUrl(perfil.foto_director)} alt="Foto del director" className="h-full w-full object-cover" />
                ) : (
                  <UserRound size={52} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">Perfil del director</p>
                    <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950 dark:text-slate-100">{obtenerNombreCompleto(director)}</h2>
                    {loading && <p className="mt-2 text-sm font-semibold text-slate-400">Cargando perfil...</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditMode((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300 dark:hover:border-blue-500/50 dark:hover:bg-slate-800"
                  >
                    {editMode ? <X size={16} /> : <Pencil size={16} />}
                    {editMode ? 'Cancelar' : 'Editar datos'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {editMode && (
          <form onSubmit={handleSubmit} className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">DNI</label>
                <input name="dni" value={formData.dni} onChange={handleInputChange} maxLength="8" inputMode="numeric" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" placeholder="8 dígitos" />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Celular</label>
                <input name="celular" value={formData.celular} onChange={handleInputChange} maxLength="9" inputMode="numeric" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" placeholder="9 dígitos" />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Correo</label>
                <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" placeholder="correo@dominio.com" />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">RUC</label>
                <input name="ruc" value={formData.ruc} onChange={handleInputChange} maxLength="11" inputMode="numeric" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" placeholder="11 dígitos" />
              </div>
            </div>

            {message && (
              <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'}`}>
                {message.text}
              </div>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={handleCancelEdit} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">Cancelar</button>
              <button type="submit" disabled={saving || !director?.id} className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"></div> : <Save size={16} />}
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {datosDirector.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-blue-500/50">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{item.label}</p>
              <p className="mt-2 break-words text-[15px] font-bold leading-6 text-slate-950 dark:text-slate-100">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerfilDirectorView;
