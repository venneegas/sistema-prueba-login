const useEspecialistaStats = (colegios) => {
  const stats = {
    total: colegios.length,
    subidos: colegios.filter((c) => c.estado !== 'Borrador').length,
    enviados: colegios.filter((c) => c.estado === 'Enviado').length,
    aprobados: colegios.filter((c) => c.estado === 'Aprobado').length,
    observados: colegios.filter((c) => c.estado === 'Observado').length,
    borradores: colegios.filter((c) => c.estado === 'Borrador').length
  };

  const pctSubidos = stats.total > 0 ? Math.round((stats.subidos / stats.total) * 100) : 0;
  const pctAprobados = stats.subidos > 0 ? Math.round((stats.aprobados / stats.subidos) * 100) : 0;
  const pctObservados = stats.subidos > 0 ? Math.round((stats.observados / stats.subidos) * 100) : 0;

  return {
    stats,
    pctSubidos,
    pctAprobados,
    pctObservados
  };
};

export default useEspecialistaStats;
