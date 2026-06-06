import React, { useEffect, useState } from 'react';
import { Download, FileDigit, FileSpreadsheet, FileText, Filter, Info, Search } from 'lucide-react';
import { buildApiUrl } from '../../config/api';

const formatCurrency = (value) => Number(value || 0).toLocaleString('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const ReportesView = ({ showToast }) => {
  const [filtros, setFiltros] = useState({
    anio: new Date().getFullYear(),
    trimestre: 'todos',
    estado: 'todos',
    busqueda: ''
  });
  const [previewData, setPreviewData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchReporte = async () => {
      setIsLoading(true);

      try {
        const trimestres = filtros.trimestre === 'todos' ? ['1', '2', '3', '4'] : [filtros.trimestre];
        const responses = await Promise.all(
          trimestres.map(async (trimestre) => {
            const response = await fetch(
              buildApiUrl(`/api/especialista/reporte-global?trimestre=${trimestre}&anio=${filtros.anio}`),
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
            const data = await response.json();

            if (!response.ok || !data.success) {
              throw new Error(data.message || 'No se pudo cargar el reporte administrativo.');
            }

            return data.reporte || [];
          })
        );

        const acumulado = new Map();

        responses.flat().forEach((item) => {
          const key = item.directorId || item.codigoModular || item.nombre;
          const current = acumulado.get(key) || {
            id: key,
            colegio: item.nombre || 'Institucion sin nombre',
            codigo: item.codigoModular || '-',
            ingresos: 0,
            egresos: 0,
            saldo: 0,
            estado: item.estado || 'Borrador'
          };

          current.ingresos += Number(item.totalIngresos || 0);
          current.egresos += Number(item.totalEgresos || 0);
          current.saldo += Number(item.saldoTotal || 0);
          current.estado = item.estado || current.estado;
          acumulado.set(key, current);
        });

        const filtrados = [...acumulado.values()].filter((item) => (
          item.colegio.toLowerCase().includes(filtros.busqueda.toLowerCase())
          && (filtros.estado === 'todos' || item.estado.toLowerCase() === filtros.estado.toLowerCase())
        ));

        if (!ignore) {
          setPreviewData(filtrados);
        }
      } catch (error) {
        console.error('Error cargando reporte administrativo:', error);
        if (!ignore) {
          setPreviewData([]);
          showToast?.(error.message || 'No se pudo cargar el reporte administrativo.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchReporte();

    return () => {
      ignore = true;
    };
  }, [filtros, showToast]);

  const handleDownload = () => {
    if (previewData.length === 0) {
      showToast?.('No hay datos para exportar con los filtros actuales.');
      return;
    }

    showToast?.('Generando reporte en formato CSV...');

    const headers = ['Codigo', 'Institucion', 'Ingresos', 'Egresos', 'Saldo', 'Estado'];
    const rows = previewData.map((item) => [
      item.codigo,
      item.colegio,
      item.ingresos.toFixed(2),
      item.egresos.toFixed(2),
      item.saldo.toFixed(2),
      item.estado
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `reporte_admin_${filtros.anio}_${filtros.trimestre}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Aprobado': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Enviado': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Observado': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm px-8 py-5 flex items-center justify-between z-10 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <FileSpreadsheet className="text-blue-600" size={28} />
          Reportes y Exportacion
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-4">
              <Filter size={20} className="text-slate-400" />
              <h2 className="text-lg font-bold text-slate-700">Filtros de Exportacion</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ano fiscal</label>
                <select
                  value={filtros.anio}
                  onChange={(e) => setFiltros({ ...filtros, anio: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-slate-700"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Trimestre</label>
                <select
                  value={filtros.trimestre}
                  onChange={(e) => setFiltros({ ...filtros, trimestre: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-slate-700"
                >
                  <option value="todos">Todos los trimestres</option>
                  <option value="1">1º Trimestre (Ene-Mar)</option>
                  <option value="2">2º Trimestre (Abr-Jun)</option>
                  <option value="3">3º Trimestre (Jul-Sep)</option>
                  <option value="4">4º Trimestre (Oct-Dic)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estado de envio</label>
                <select
                  value={filtros.estado}
                  onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-slate-700"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="aprobado">Solo aprobados</option>
                  <option value="enviado">Enviados</option>
                  <option value="observado">Observados</option>
                  <option value="borrador">Borradores</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Buscar colegio</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Ej. San Juan..."
                    value={filtros.busqueda}
                    onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ExportCard
              icon={FileSpreadsheet}
              tone="emerald"
              title="Reporte detallado"
              description="Archivo con instituciones, ingresos, egresos, saldo y estado del periodo filtrado."
              buttonText="Exportar CSV"
              onClick={handleDownload}
            />
            <ExportCard
              icon={FileText}
              tone="rose"
              title="Resumen ejecutivo"
              description="Base consolidada para generar reportes administrativos y revisiones externas."
              buttonText="Exportar CSV"
              onClick={handleDownload}
            />
            <ExportCard
              icon={FileDigit}
              tone="blue"
              title="Datos planos"
              description="Archivo CSV ligero para analisis, migracion o cruce con otras herramientas."
              buttonText="Exportar CSV"
              onClick={handleDownload}
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Info size={18} className="text-blue-500" />
                Vista previa de datos reales
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-md">
                {previewData.length} registros encontrados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse relative">
                <thead>
                  <tr className="bg-white border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold">Cod. / Institucion</th>
                    <th className="p-4 font-bold text-right">Ingresos (S/)</th>
                    <th className="p-4 font-bold text-right">Egresos (S/)</th>
                    <th className="p-4 font-bold text-right">Saldo final (S/)</th>
                    <th className="p-4 font-bold text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">Cargando datos reales...</td>
                    </tr>
                  ) : previewData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">No hay datos que coincidan con los filtros actuales.</td>
                    </tr>
                  ) : (
                    previewData.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{row.colegio}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">Cod: {row.codigo}</div>
                        </td>
                        <td className="p-4 text-right font-medium text-blue-600">{formatCurrency(row.ingresos)}</td>
                        <td className="p-4 text-right font-medium text-rose-600">{formatCurrency(row.egresos)}</td>
                        <td className="p-4 text-right font-bold text-slate-700">{formatCurrency(row.saldo)}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold border ${getEstadoBadge(row.estado)}`}>
                            {row.estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const ExportCard = ({ icon: Icon, tone, title, description, buttonText, onClick }) => {
  const tones = {
    emerald: {
      icon: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600',
      border: 'hover:border-emerald-300',
      button: 'bg-emerald-600 hover:bg-emerald-700'
    },
    rose: {
      icon: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600',
      border: 'hover:border-rose-300',
      button: 'bg-rose-600 hover:bg-rose-700'
    },
    blue: {
      icon: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600',
      border: 'hover:border-blue-300',
      button: 'bg-blue-600 hover:bg-blue-700'
    }
  };
  const classes = tones[tone];

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center hover:shadow-md transition-all group ${classes.border}`}>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:text-white group-hover:scale-110 transition-all ${classes.icon}`}>
        <Icon size={32} />
      </div>
      <h3 className="font-bold text-slate-800 text-lg mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-6">{description}</p>
      <button
        onClick={onClick}
        className={`w-full mt-auto flex items-center justify-center gap-2 text-white py-2.5 rounded-xl font-bold transition-colors shadow-sm ${classes.button}`}
      >
        <Download size={18} />
        {buttonText}
      </button>
    </div>
  );
};

export default ReportesView;
