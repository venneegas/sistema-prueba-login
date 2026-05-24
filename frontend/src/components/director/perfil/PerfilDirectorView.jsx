import React, { useEffect, useState } from 'react';
import { Building2, UserRound } from 'lucide-react';
import API_BASE_URL, { buildApiUrl } from '../../../config/api';
import ProfileImageUploader from './ProfileImageUploader';

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

const PerfilDirectorView = ({ director }) => {
  const [perfil, setPerfil] = useState({
    foto_director: null,
    escudo_colegio: null,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState('');
  const [message, setMessage] = useState(null);

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
            escudo_colegio: result.data?.escudo_colegio || null,
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

  const uploadImage = async (type, file) => {
    if (!director?.id) return;

    setUploading(type);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('imagen', file);

      const response = await fetch(buildApiUrl(`/api/perfil/${director.id}/${type}`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'No se pudo subir la imagen.');
      }

      setPerfil((prev) => ({
        ...prev,
        ...(type === 'foto'
          ? { foto_director: result.data?.foto_director }
          : { escudo_colegio: result.data?.escudo_colegio }),
      }));
      setMessage({ type: 'success', text: 'Imagen actualizada correctamente.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error al subir la imagen.' });
    } finally {
      setUploading('');
      setTimeout(() => setMessage(null), 4000);
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
      <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] border border-slate-200">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Perfil</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Datos del Director</h2>
          </div>
          {loading && <span className="text-sm font-semibold text-slate-400">Cargando perfil...</span>}
        </div>

        {message && (
          <div className={`mb-6 rounded-xl border px-4 py-3 text-sm font-semibold ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <ProfileImageUploader
            title="Foto del director"
            subtitle="Imagen para identificar al responsable de la institucion."
            imageUrl={buildAssetUrl(perfil.foto_director)}
            fallback={<UserRound size={42} />}
            shape="rounded-full"
            uploading={uploading === 'foto'}
            onFileSelected={(file) => uploadImage('foto', file)}
          />

          <ProfileImageUploader
            title="Escudo del colegio"
            subtitle="Imagen institucional para el perfil del colegio."
            imageUrl={buildAssetUrl(perfil.escudo_colegio)}
            fallback={<Building2 size={42} />}
            uploading={uploading === 'escudo'}
            onFileSelected={(file) => uploadImage('escudo', file)}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {datosDirector.map((item) => (
            <div key={item.label} className="rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white px-5 py-4 shadow-sm hover:shadow-md transition-all">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{item.label}</p>
              <p className="text-base font-semibold text-gray-800 mt-1 break-words">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerfilDirectorView;
