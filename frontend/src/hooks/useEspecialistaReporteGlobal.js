import { useEffect, useState } from 'react';
import { buildApiUrl } from '../config/api';

const useEspecialistaReporteGlobal = ({ trimestreSeleccionado, anioActual }) => {
  const [reporte, setReporte] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReporte = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          buildApiUrl(`/api/especialista/reporte-global?trimestre=${trimestreSeleccionado}&anio=${anioActual}`),
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        const data = await response.json();

        if (data.success) {
          setReporte(data.reporte);
        } else {
          setError(data.message || 'Error al cargar el reporte global');
        }
      } catch (err) {
        console.error('Error al cargar reporte global:', err);
        setError('No se pudo cargar el reporte global.');
      } finally {
        setLoading(false);
      }
    };

    fetchReporte();
  }, [trimestreSeleccionado, anioActual]);

  return {
    reporte,
    loading,
    error
  };
};

export default useEspecialistaReporteGlobal;
