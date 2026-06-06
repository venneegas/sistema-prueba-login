import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, FileDigit, Search, Filter, Download, Info, CheckCircle } from 'lucide-react';

const ReportesView = ({ showToast }) => {
  // Estado para los filtros
  const [filtros, setFiltros] = useState({
    anio: new Date().getFullYear(),
    trimestre: 'todos',
    estado: 'todos',
    busqueda: ''
  });

  // Estado para la tabla de vista previa
  const [previewData, setPreviewData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Simulación de carga de datos basada en los filtros
  useEffect(() => {
    setIsLoading(true);
    
    // NOTA: Aquí deberías hacer el fetch real a tu backend
    // ej: fetch(`/api/reportes/preview?anio=${filtros.anio}&estado=${filtros.estado}...`)
    
    const timer = setTimeout(() => {
      // Datos de prueba simulados
      const mockData = [
        { id: 1, colegio: 'I.E. Jorge Chávez', codigo: '045879', ingresos: 15000, egresos: 14500, saldo: 500, estado: 'Aprobado' },
        { id: 2, colegio: 'I.E. San Juan', codigo: '012456', ingresos: 12000, egresos: 12000, saldo: 0, estado: 'Enviado' },
        { id: 3, colegio: 'I.E. Maria Parado de Bellido', codigo: '078965', ingresos: 8000, egresos: 8500, saldo: -500, estado: 'Observado' },
        { id: 4, colegio: 'I.E. Miguel Grau', codigo: '036521', ingresos: 20000, egresos: 18000, saldo: 2000, estado: 'Borrador' },
        { id: 5, colegio: 'I.E. Los Pinos', codigo: '098741', ingresos: 5000, egresos: 3000, saldo: 2000, estado: 'Aprobado' },
      ];

      // Aplicar filtro de búsqueda local solo para la simulación
      const filtrados = mockData.filter(item => 
        item.colegio.toLowerCase().includes(filtros.busqueda.toLowerCase()) &&
        (filtros.estado === 'todos' || item.estado.toLowerCase() === filtros.estado.toLowerCase())
      );

      setPreviewData(filtrados);
      setIsLoading(false);
    }, 600); // Simulamos retardo de red

    return () => clearTimeout(timer);
  }, [filtros]);

  // Función simulada para descargar
  const handleDownload = (formato) => {
    if (showToast) {
      showToast(`Generando reporte en formato ${formato.toUpperCase()}...`);
    }
    // Aquí implementarás la lógica de descarga con exceljs o jspdf
    console.log(`Descargando data con filtros:`, filtros, `en formato:`, formato);
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
      {/* Cabecera Principal */}
      <header className="bg-white shadow-sm px-8 py-5 flex items-center justify-between z-10 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <FileSpreadsheet className="text-blue-600" size={28} />
          Reportes y Exportación
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* 1. SECCIÓN DE FILTROS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-4">
              <Filter size={20} className="text-slate-400" />
              <h2 className="text-lg font-bold text-slate-700">Filtros de Exportación</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Año Fiscal</label>
                <select 
                  value={filtros.anio} onChange={(e) => setFiltros({...filtros, anio: e.target.value})}
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
                  value={filtros.trimestre} onChange={(e) => setFiltros({...filtros, trimestre: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-slate-700"
                >
                  <option value="todos">Todos los Trimestres</option>
                  <option value="1">1º Trimestre (Ene-Mar)</option>
                  <option value="2">2º Trimestre (Abr-Jun)</option>
                  <option value="3">3º Trimestre (Jul-Sep)</option>
                  <option value="4">4º Trimestre (Oct-Dic)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estado de Envío</label>
                <select 
                  value={filtros.estado} onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-slate-700"
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="aprobado">Solo Aprobados</option>
                  <option value="enviado">Enviados (En revisión)</option>
                  <option value="observado">Observados</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Buscar Colegio</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Ej. San Juan..." 
                    value={filtros.busqueda} onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. TARJETAS DE EXPORTACIÓN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tarjeta Excel */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center hover:border-emerald-300 hover:shadow-md transition-all group">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileSpreadsheet size={32} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Reporte Detallado</h3>
              <p className="text-sm text-slate-500 mb-6">Archivo Excel (.xlsx) con celdas formateadas, sumatorias y cruce de datos financieros.</p>
              <button 
                onClick={() => handleDownload('excel')}
                className="w-full mt-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold transition-colors shadow-sm"
              >
                <Download size={18} /> Exportar Excel
              </button>
            </div>

            {/* Tarjeta PDF */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center hover:border-rose-300 hover:shadow-md transition-all group">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText size={32} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Resumen Ejecutivo</h3>
              <p className="text-sm text-slate-500 mb-6">Documento PDF listo para imprimir con gráficas y resúmenes para presentar a jefatura.</p>
              <button 
                onClick={() => handleDownload('pdf')}
                className="w-full mt-auto flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold transition-colors shadow-sm"
              >
                <Download size={18} /> Exportar PDF
              </button>
            </div>

            {/* Tarjeta CSV */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileDigit size={32} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Datos Planos (Raw)</h3>
              <p className="text-sm text-slate-500 mb-6">Archivo CSV ligero ideal para migraciones masivas o importación a otros sistemas.</p>
              <button 
                onClick={() => handleDownload('csv')}
                className="w-full mt-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold transition-colors shadow-sm"
              >
                <Download size={18} /> Exportar CSV
              </button>
            </div>
          </div>

          {/* 3. VISTA PREVIA (PREVIEW TABLE) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Info size={18} className="text-blue-500" />
                Vista Previa de Datos
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-md">
                {previewData.length} registros encontrados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse relative">
                <thead>
                  <tr className="bg-white border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold">Cod. / Institución</th>
                    <th className="p-4 font-bold text-right">Ingresos (S/)</th>
                    <th className="p-4 font-bold text-right">Egresos (S/)</th>
                    <th className="p-4 font-bold text-right">Saldo Final (S/)</th>
                    <th className="p-4 font-bold text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">Actualizando vista previa...</td>
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
                        <td className="p-4 text-right font-medium text-emerald-600">{row.ingresos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right font-medium text-rose-600">{row.egresos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right font-bold text-slate-700">{row.saldo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
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

export default ReportesView;
