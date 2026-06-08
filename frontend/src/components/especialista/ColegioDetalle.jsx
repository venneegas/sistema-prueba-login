import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, DollarSign, Download, Eye, Building2, CheckCircle, XCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { getEstadoReporteBadgeClass, getEstadoReporteLabel, isEstadoPendiente } from '../../utils/estadoReporte';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const ColegioDetalle = ({ colegio, onBack, trimestre, anio }) => {
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [successModal, setSuccessModal] = useState(null);
  const [errorModal, setErrorModal] = useState(null);
  const [rejectComment, setRejectComment] = useState('');

  const [finanzas, setFinanzas] = useState({ ingresos: 0, egresos: 0, dineroEnCaja: 0, dineroEnBanco: 0, saldoTotal: 0 });
  const [loadingFinanzas, setLoadingFinanzas] = useState(true);
  
  const [pdfs, setPdfs] = useState([]);
  const [loadingPdfs, setLoadingPdfs] = useState(true);

  // Efecto para traer los datos financieros cuando se abre el colegio
  useEffect(() => {
    const fetchFinanzas = async () => {
      setLoadingFinanzas(true);
      try {
        // Nota: colegio.id equivale al directorId en nuestra consulta SQL
        const response = await fetch(`${API_URL}/api/especialista/colegio/${colegio.id}/finanzas?trimestre=${trimestre}&anio=${anio}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          setFinanzas({
            ingresos: data.totalIngresos,
            egresos: data.totalEgresos,
            dineroEnCaja: data.dineroEnCaja,
            dineroEnBanco: data.dineroEnBanco,
            saldoTotal: data.saldoTotal
          });
        }
      } catch (error) {
        console.error("Error al cargar finanzas:", error);
      } finally {
        setLoadingFinanzas(false);
      }
    };

    if (colegio?.id) fetchFinanzas();
  }, [colegio.id, trimestre, anio]);

  // Efecto para traer los PDFs subidos
  useEffect(() => {
    const fetchPdfs = async () => {
      setLoadingPdfs(true);
      try {
        const response = await fetch(`${API_URL}/api/especialista/colegio/${colegio.id}/pdfs?trimestre=${trimestre}&anio=${anio}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          setPdfs(data.pdfs);
        }
      } catch (error) {
        console.error("Error al cargar PDFs:", error);
      } finally {
        setLoadingPdfs(false);
      }
    };

    if (colegio?.id) fetchPdfs();
  }, [colegio.id, trimestre, anio]);

  const formatearMoneda = (monto) => {
    return `S/ ${Number(monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '-';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatearTamano = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Limpia y normaliza la URL para evitar errores de doble slash (//) o diagonales invertidas (\)
  const getPdfUrl = (ruta) => {
    if (!ruta) return '#';
    let rutaNormalizada = ruta.replace(/\\/g, '/');
    if (rutaNormalizada.startsWith('/')) {
      rutaNormalizada = rutaNormalizada.substring(1);
    }
    return `${API_URL}/${rutaNormalizada}`;
  };

  const handleRejectSubmit = async () => {
    if (!rejectComment.trim()) {
      setErrorModal({ isOpen: true, message: "Por favor, ingresa un motivo para la observación." });
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/especialista/auditar`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          directorId: colegio.id,
          trimestre: trimestre,
          anio: anio,
          estado: 'Observado',
          comentario: rejectComment
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setIsRejectModalOpen(false);
        setRejectComment('');
        setSuccessModal({ isOpen: true, type: 'reject', message: "El informe ha sido OBSERVADO. El director ha sido notificado." });
      }
    } catch (error) {
      console.error("Error al rechazar:", error);
      setErrorModal({ isOpen: true, message: "Error de conexión al guardar la auditoría." });
    }
  };

  const handleApproveSubmit = async () => {
    try {
      const response = await fetch(`${API_URL}/api/especialista/auditar`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          directorId: colegio.id,
          trimestre: trimestre,
          anio: anio,
          estado: 'Aprobado'
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setIsApproveModalOpen(false);
        setSuccessModal({ isOpen: true, type: 'approve', message: "El informe ha sido APROBADO exitosamente." });
      }
    } catch (error) {
      console.error("Error al aprobar:", error);
      setErrorModal({ isOpen: true, message: "Error de conexión al guardar la auditoría." });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Cabecera de Navegación */}
      <header className="bg-white dark:bg-slate-800 shadow-sm px-8 py-5 flex items-center gap-4 z-10 border-b border-slate-200 dark:border-slate-700">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
          title="Volver a las carpetas"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building2 size={24} className="text-blue-500" />
            {colegio.nombre}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1 flex items-center gap-2">
            {colegio.numeroIE ? `N° IE: ${colegio.numeroIE}` : 'N° IE: -'}
            <span className="text-slate-300 dark:text-slate-600">|</span>
            Código Modular: {colegio.codigoModular}
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded font-bold text-xs tracking-wide border border-blue-100 dark:border-blue-800">Trimestre {trimestre}</span>
          </p>
        </div>
        
        <div className={`px-4 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase border shadow-sm ${getEstadoReporteBadgeClass(colegio.estado)}`}>
          {getEstadoReporteLabel(colegio.estado)}
        </div>
      </header>

      {/* Contenido (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Panel de Acciones de Auditoría */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Resolución de Auditoría</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Evalúa la declaración tras contrastarla con los sustentos adjuntos.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              {isEstadoPendiente(colegio.estado) ? (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800 text-sm font-bold w-full md:w-auto justify-center">
                  <AlertCircle size={18} />
                  En fase pendiente (no auditable)
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setIsRejectModalOpen(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-700 dark:hover:text-rose-300 rounded-xl font-bold transition-colors border border-rose-200 dark:border-rose-800"
                  >
                    <XCircle size={20} />
                    Observar / Rechazar
                  </button>
                  <button 
                    onClick={() => setIsApproveModalOpen(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm hover:shadow rounded-xl font-bold transition-all"
                  >
                    <CheckCircle size={20} />
                    Aprobar Informe
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tarjetas de Resumen Financiero */}
          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">Dinero en caja de la I.E</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Ingresos</p>
                {loadingFinanzas ? (
                  <Loader2 size={24} className="animate-spin text-slate-400 dark:text-slate-500 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatearMoneda(finanzas.ingresos)}</p>
                )}
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Egresos</p>
                {loadingFinanzas ? (
                  <Loader2 size={24} className="animate-spin text-slate-400 dark:text-slate-500 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatearMoneda(finanzas.egresos)}</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Saldo Trimestral</p>
                {loadingFinanzas ? (
                  <Loader2 size={24} className="animate-spin text-slate-400 dark:text-slate-500 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatearMoneda(finanzas.dineroEnCaja)}</p>
                )}
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mt-8">Dinero en Cuenta Corriente</h2>
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Building2 size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Dinero en Cuenta Corriente</p>
                {loadingFinanzas ? (
                  <Loader2 size={24} className="animate-spin text-slate-400 dark:text-slate-500 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatearMoneda(finanzas.dineroEnBanco)}</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-blue-200 dark:border-blue-800 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Saldo Total al cierre del Trimestre</p>
                {loadingFinanzas ? (
                  <Loader2 size={24} className="animate-spin text-blue-400 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-blue-950 dark:text-slate-100">{formatearMoneda(finanzas.saldoTotal)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sección de Documentos PDF */}
          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mt-8">Sustentos Subidos (PDF)</h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-700">
                  <th className="p-4 font-medium">Nombre del Archivo</th>
                  <th className="p-4 font-medium">Fecha de Subida</th>
                  <th className="p-4 font-medium">Tamaño</th>
                  <th className="p-4 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingPdfs ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <Loader2 size={32} className="animate-spin mx-auto mb-2 text-blue-500" />
                      Cargando documentos...
                    </td>
                  </tr>
                ) : pdfs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <FileText size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      No se encontraron sustentos subidos para este trimestre.
                    </td>
                  </tr>
                ) : (
                  pdfs.map((pdf) => (
                    <tr key={pdf.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="p-4 font-medium text-slate-700 dark:text-slate-200 flex items-center gap-3">
                        <FileText className="text-red-500 flex-shrink-0" size={20} />
                        <span className="truncate max-w-xs block" title={pdf.nombre_original}>{pdf.nombre_original}</span>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">{formatearFecha(pdf.subido_en)}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">{formatearTamano(pdf.tamanio_bytes)}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          {/* Usamos target="_blank" para abrir el archivo directamente desde nuestro servidor de uploads */}
                          <a href={getPdfUrl(pdf.ruta_archivo)} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Ver PDF">
                            <Eye size={18} />
                          </a>
                          <a href={getPdfUrl(pdf.ruta_archivo)} download target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Descargar">
                            <Download size={18} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODAL DE RECHAZO / OBSERVACIÓN --- */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-700">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <XCircle className="text-rose-500" size={20} />
                Observar / Rechazar Declaración
              </h3>
              <button 
                onClick={() => setIsRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Cuerpo del modal */}
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Por favor, detalla los motivos por los cuales estás observando o rechazando el informe financiero de <strong>{colegio.nombre}</strong>. Este mensaje será visible para el director.
              </p>
              <textarea 
                className="w-full h-32 p-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                placeholder="Ej: Falta adjuntar la factura de compra de materiales de limpieza correspondiente al mes de febrero..."
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
              ></textarea>
            </div>
            
            {/* Pie del modal (Botones) */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button 
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleRejectSubmit}
                className="px-4 py-2 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                <XCircle size={16} />
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE APROBACIÓN --- */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-700">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle className="text-emerald-500" size={20} />
                Confirmar Aprobación
              </h3>
              <button 
                onClick={() => setIsApproveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Cuerpo del modal */}
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                ¿Estás seguro de que deseas <strong>aprobar</strong> el informe financiero de <strong>{colegio.nombre}</strong>? 
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">
                Al confirmar, se registrará la auditoría como exitosa y se enviará una notificación automática al director indicando que su declaración ha sido aceptada.
              </p>
            </div>
            
            {/* Pie del modal (Botones) */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button 
                onClick={() => setIsApproveModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleApproveSubmit}
                className="px-4 py-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Sí, Aprobar Informe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE ÉXITO --- */}
      {successModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-700">
            <div className="p-6 text-center">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${successModal.type === 'approve' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                {successModal.type === 'approve' ? <CheckCircle size={32} /> : <XCircle size={32} />}
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                {successModal.type === 'approve' ? '¡Aprobado!' : '¡Observado!'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {successModal.message}
              </p>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-center">
              <button 
                onClick={() => {
                  setSuccessModal(null);
                  onBack(); // Regresamos al explorador recién cuando el usuario cierra este modal
                }}
                className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-colors w-full ${successModal.type === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE ERROR --- */}
      {errorModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-700">
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                Hubo un problema
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {errorModal.message}
              </p>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-center">
              <button 
                onClick={() => setErrorModal(null)}
                className="px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-colors w-full bg-red-500 hover:bg-red-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColegioDetalle;
