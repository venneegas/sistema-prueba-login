import React, { useEffect, useState } from 'react';
import { Building2, UserRound } from 'lucide-react';
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

const PerfilDirectorView = ({ director }) => {
  const [perfil, setPerfil] = useState({
    foto_director: null,
    escudo_colegio: null,
  });
  const [loading, setLoading] = useState(true);

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

  const datosDirector = [
    { label: 'DNI', value: director?.dni || 'No disponible' },
    { label: 'Celular', value: director?.celular || 'No disponible' },
    { label: 'Correo', value: director?.email || director?.correo || 'No disponible' },
    { label: 'RUC', value: director?.ruc || director?.ruc_ie || director?.institucion_ruc || 'No registrado' },
  ];

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto space-y-8">
      <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] border border-slate-200">
        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-slate-50">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-blue-100 text-blue-700 shadow-lg">
                {perfil.foto_director ? (
                  <img src={buildAssetUrl(perfil.foto_director)} alt="Foto del director" className="h-full w-full object-cover" />
                ) : (
                  <UserRound size={52} />
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Perfil del director</p>
                <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950">{obtenerNombreCompleto(director)}</h2>
                {loading && <p className="mt-2 text-sm font-semibold text-slate-400">Cargando perfil...</p>}
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-blue-700">
                {perfil.escudo_colegio ? (
                  <img src={buildAssetUrl(perfil.escudo_colegio)} alt="Escudo del colegio" className="h-full w-full object-cover" />
                ) : (
                  <Building2 size={40} />
                )}
              </div>
              <div>
                <p className="text-sm font-extrabold uppercase tracking-wide text-slate-900">Escudo institucional</p>
                <p className="mt-1 text-sm text-slate-500">Imagen representativa del colegio.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {datosDirector.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
              <p className="mt-2 break-words text-[15px] font-bold leading-6 text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerfilDirectorView;
