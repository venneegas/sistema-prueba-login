import { useEffect, useState } from 'react';
import { buildApiUrl } from '../config/api';

const useEspecialistaColegios = ({ trimestreSeleccionado, anioActual }) => {
  const [colegios, setColegios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchColegios = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          buildApiUrl(`/api/especialista/colegios?trimestre=${trimestreSeleccionado}&anio=${anioActual}`),
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        const data = await response.json();

        if (data.success) {
          setColegios(data.colegios);
        } else {
          setError(data.message || 'Error al cargar colegios');
        }
      } catch (err) {
        console.error('Error al conectar con la API:', err);
        setError('No se pudo conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchColegios();
  }, [trimestreSeleccionado, anioActual]);

  return {
    colegios,
    loading,
    error
  };
};

export default useEspecialistaColegios;
