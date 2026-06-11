import React, { useCallback, useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  DollarSign,
  Download,
  Eye,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Loader2,
  ClipboardCheck,
  Landmark,
  Save,
  WalletCards
} from 'lucide-react';
import { getEstadoReporteBadgeClass, getEstadoReporteLabel, isEstadoPendiente } from '../../utils/estadoReporte';
import API_BASE_URL, { buildApiUrl } from '../../config/api';

const API_URL = API_BASE_URL;

const ColegioDetalle = ({ colegio, onBack, trimestre, anio }) => {
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [successModal, setSuccessModal] = useState(null);
  const [errorModal, setErrorModal] = useState(null);
  const [rejectComment, setRejectComment] = useState('');
  const [manualForm, setManualForm] = useState({
    totalIngresos: '',
    totalEgresos: '',
    saldoBancoFinal: '',
    observacion: 'Extensión excepcional Q1 hasta 18/06/2026'
  });

  const [finanzas, setFinanzas] = useState({ ingresos: 0, egresos: 0, dineroEnCaja: 0, dineroEnBanco: 0, saldoTotal: 0 });
  const [loadingFinanzas, setLoadingFinanzas] = useState(true);
  
  const [pdfs, setPdfs] = useState([]);
  const [loadingPdfs, setLoadingPdfs] = useState(true);

  const fetchFinanzas = useCallback(async () => {
    setLoadingFinanzas(true);
    try {
      const response = await fetch(buildApiUrl(`/api/especialista/colegio/${colegio.id}/finanzas?trimestre=${trimestre}&anio=${anio}`), {
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
  }, [colegio.id, trimestre, anio]);

  // Efecto para traer los datos financieros cuando se abre el colegio
  useEffect(() => {
    if (colegio?.id) fetchFinanzas();
  }, [colegio?.id, fetchFinanzas]);

  // Efecto para traer los PDFs subidos
  useEffect(() => {
    const fetchPdfs = async () => {
      setLoadingPdfs(true);
      try {
        const response = await fetch(buildApiUrl(`/api/especialista/colegio/${colegio.id}/pdfs?trimestre=${trimestre}&anio=${anio}`), {
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
      const response = await fetch(buildApiUrl('/api/especialista/auditar'), {
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
      const response = await fetch(buildApiUrl('/api/especialista/auditar'), {
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

  const handleManualInputChange = (field, value) => {
    setManualForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenManualModal = () => {
    setManualForm({
      totalIngresos: finanzas.ingresos || '',
      totalEgresos: finanzas.egresos || '',
      saldoBancoFinal: finanzas.dineroEnBanco || '',
      observacion: 'Extensión excepcional Q1 hasta 18/06/2026'
    });
    setIsManualModalOpen(true);
  };

  const handleManualSubmit = async () => {
    if (!manualForm.observacion.trim()) {
      setErrorModal({ isOpen: true, message: 'Ingresa un motivo para que la carga quede auditada.' });
      return;
    }

    setIsSavingManual(true);

    try {
      const response = await fetch(buildApiUrl('/api/especialista/consolidado/manual'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          directorId: colegio.id,
          trimestre,
          anio,
          totalIngresos: manualForm.totalIngresos,
          totalEgresos: manualForm.totalEgresos,
          saldoBancoFinal: manualForm.saldoBancoFinal,
          observacion: manualForm.observacion
        })
      });
      const data = await response.json();

      if (!data.success) {
        setErrorModal({ isOpen: true, message: data.message || 'No se pudo registrar la carga manual.' });
        return;
      }

      setIsManualModalOpen(false);
      await fetchFinanzas();
      setSuccessModal({
        isOpen: true,
        type: 'manual',
        message: 'La carga manual fue registrada en el consolidado y quedó visible en auditoría.'
      });
    } catch (error) {
      console.error("Error en carga manual:", error);
      setErrorModal({ isOpen: true, message: 'Error de conexión al registrar la carga manual.' });
    } finally {
      setIsSavingManual(false);
    }
  };

  const periodoLabel = `${trimestre}º Trimestre ${anio}`;
  const estadoLabel = getEstadoReporteLabel(colegio.estado);
  const pendiente = isEstadoPendiente(colegio.estado);
  const puedeCargaManual = Number(trimestre) === 1 && Number(anio) === 2026;
  const resumenFinanciero = [
    {
      label: 'Total ingresos',
      value: finanzas.ingresos,
      icon: DollarSign,
      tone: 'text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800'
    },
    {
      label: 'Total egresos',
      value: finanzas.egresos,
      icon: DollarSign,
      tone: 'text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800'
    },
    {
      label: 'Saldo en caja',
      value: finanzas.dineroEnCaja,
      icon: WalletCards,
      tone: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/30 border-sky-100 dark:border-sky-800'
    },
    {
      label: 'Cuenta corriente',
      value: finanzas.dineroEnBanco,
      icon: Landmark,
      tone: 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 border-teal-100 dark:border-teal-800'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <header className="relative z-[120] mx-8 mt-8 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.8)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/95 lg:flex-row lg:items-center lg:justify-between">
        <button
          onClick={onBack}
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white lg:static"
          title="Volver a los colegios"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="min-w-0 flex-1 pl-12 lg:pl-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">
            Detalle de reporte
          </p>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            <Building2 size={26} className="shrink-0 text-blue-600 dark:text-blue-300" />
            <span className="truncate">{colegio.nombre}</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900">
              {colegio.numeroIE ? `IE ${colegio.numeroIE}` : 'IE -'}
            </span>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono dark:border-slate-700 dark:bg-slate-900">
              {colegio.codigoModular || '-'}
            </span>
            <span className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {periodoLabel}
            </span>
          </div>
        </div>

        <div className={`inline-flex w-fit items-center gap-2 rounded-xl border px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] shadow-sm ${getEstadoReporteBadgeClass(colegio.estado)}`}>
          <ClipboardCheck size={16} />
          {estadoLabel}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-col gap-5 border-b border-slate-100 bg-slate-50/70 p-6 dark:border-slate-700 dark:bg-slate-900/40 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  <ClipboardCheck size={24} />
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                    Auditoria del reporte
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">
                    Resolucion de auditoria
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                    Contrasta los montos declarados con los sustentos adjuntos antes de aprobar u observar el informe.
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                {puedeCargaManual && (
                  <button
                    type="button"
                    onClick={handleOpenManualModal}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 lg:flex-none"
                  >
                    <Save size={18} />
                    Carga manual
                  </button>
                )}
                {pendiente ? (
                  <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300 lg:w-auto">
                    <AlertCircle size={18} />
                    Pendiente de envio
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setIsRejectModalOpen(true)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/50 lg:flex-none"
                    >
                      <XCircle size={19} />
                      Observar
                    </button>
                    <button
                      onClick={() => setIsApproveModalOpen(true)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow lg:flex-none"
                    >
                      <CheckCircle size={19} />
                      Aprobar informe
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Estado actual</p>
                <p className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">{estadoLabel}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sustentos PDF</p>
                <p className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">{pdfs.length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Accion disponible</p>
                <p className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">{pendiente ? 'Solo consulta' : 'Auditable'}</p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="border-b border-slate-100 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Resumen financiero</p>
              <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">Montos declarados</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
              {resumenFinanciero.map(({ label, value, icon: Icon, tone }) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border ${tone}`}>
                    <Icon size={22} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
                  {loadingFinanzas ? (
                    <Loader2 size={22} className="mt-3 animate-spin text-blue-500" />
                  ) : (
                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{formatearMoneda(value)}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 bg-slate-950 px-6 py-4 text-white dark:border-slate-700">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-black uppercase tracking-wide">Saldo total al cierre del trimestre</p>
                {loadingFinanzas ? (
                  <Loader2 size={20} className="animate-spin text-blue-300" />
                ) : (
                  <p className="text-xl font-black text-blue-200">{formatearMoneda(finanzas.saldoTotal)}</p>
                )}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Sustento documental</p>
                <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">PDF enviados por la institucion</h2>
              </div>
              <span className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {pdfs.length} archivo(s)
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {loadingPdfs ? (
                <div className="flex items-center justify-center gap-3 p-10 text-slate-500 dark:text-slate-400">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <span className="font-medium">Cargando documentos...</span>
                </div>
              ) : pdfs.length === 0 ? (
                <div className="p-10 text-center text-slate-500 dark:text-slate-400">
                  <FileText size={38} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="font-bold text-slate-700 dark:text-slate-200">No hay sustentos subidos</p>
                  <p className="mt-1 text-sm">Aun no se encontraron documentos para este periodo.</p>
                </div>
              ) : (
                pdfs.map((pdf) => (
                  <div key={pdf.id} className="flex flex-col gap-4 p-5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
                        <FileText size={24} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-800 dark:text-slate-100" title={pdf.nombre_original}>{pdf.nombre_original}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                          <span>{formatearFecha(pdf.subido_en)}</span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 dark:bg-slate-700">{formatearTamano(pdf.tamanio_bytes)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-2">
                      <span className="mr-1 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <CheckCircle size={14} />
                        Recibido
                      </span>
                      <a href={getPdfUrl(pdf.ruta_archivo)} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 p-2.5 text-slate-500 shadow-sm transition-all hover:border-sky-500 hover:bg-sky-500 hover:text-white dark:border-slate-700 dark:text-slate-300" title="Ver PDF">
                        <Eye size={18} />
                      </a>
                      <a href={getPdfUrl(pdf.ruta_archivo)} download target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 p-2.5 text-slate-500 shadow-sm transition-all hover:border-blue-600 hover:bg-blue-600 hover:text-white dark:border-slate-700 dark:text-slate-300" title="Descargar">
                        <Download size={18} />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
      {/* --- MODAL DE RECHAZO / OBSERVACIÓN --- */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Save className="text-blue-600 dark:text-blue-300" size={20} />
                Carga manual excepcional Q1
              </h3>
              <button 
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
                disabled={isSavingManual}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium leading-6 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                Esta carga aplica solo para el 1er trimestre 2026 y queda bloqueada al 18/06/2026. Se registrara en auditoria como actualizacion manual del consolidado.
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ingresos</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualForm.totalIngresos}
                    onChange={(event) => handleManualInputChange('totalIngresos', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900/40"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Egresos</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualForm.totalEgresos}
                    onChange={(event) => handleManualInputChange('totalEgresos', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900/40"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Banco final</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualForm.saldoBancoFinal}
                    onChange={(event) => handleManualInputChange('saldoBancoFinal', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900/40"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Motivo de auditoria</span>
                <textarea
                  value={manualForm.observacion}
                  onChange={(event) => handleManualInputChange('observacion', event.target.value)}
                  className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900/40"
                />
              </label>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                disabled={isSavingManual}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={isSavingManual}
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                {isSavingManual ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Guardar carga
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                successModal.type === 'approve'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : successModal.type === 'manual'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                    : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
              }`}>
                {successModal.type === 'approve' ? <CheckCircle size={32} /> : successModal.type === 'manual' ? <Save size={32} /> : <XCircle size={32} />}
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                {successModal.type === 'approve' ? '¡Aprobado!' : successModal.type === 'manual' ? 'Carga registrada' : '¡Observado!'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {successModal.message}
              </p>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-center">
              <button 
                onClick={() => {
                  setSuccessModal(null);
                  if (successModal.type !== 'manual') {
                    onBack();
                  }
                }}
                className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-colors w-full ${
                  successModal.type === 'approve'
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : successModal.type === 'manual'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-rose-500 hover:bg-rose-600'
                }`}
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

