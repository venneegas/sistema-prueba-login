import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Eye, Loader2 } from 'lucide-react';
import { buildApiUrl } from '../../config/api';
import { registrarAccion } from '../../utils/auditHelper';
import Toast from '../Toast';
import ConfirmModal from './ConfirmModal';

const SubirPDFView = ({ trimestreMeses, trimestreId, anio, directorId, trimestreCerrado }) => {
  const [archivos, setArchivos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: null,
    isDestructive: false
  });
  
  const etiquetaTrimestre = trimestreMeses.join(' - ').toUpperCase();

  // Cargar los archivos desde el backend al abrir la vista o cambiar de trimestre
  useEffect(() => {
    const cargarArchivos = async () => {
      if (!directorId || !trimestreId) return;

      // Limpiar la lista actual antes de traer los nuevos para evitar el "efecto fantasma"
      setArchivos([]);
      setError('');

      try {
        const query = new URLSearchParams({
          directorId,
          anio: anio,
          trimestreId
        });

        const response = await fetch(buildApiUrl(`/api/sustentos?${query.toString()}`), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();

        if (response.ok && data.success) {
          // Mapeamos los datos de la BD al formato que usa nuestra tabla
          const archivosGuardados = data.data.map(pdf => ({
            id: pdf.id,
            nombre: pdf.nombre_original,
            tamano: (pdf.tamanio_bytes / 1024 / 1024).toFixed(2) + ' MB',
            ruta: pdf.ruta_archivo,
            estado: 'Listo'
          }));
          setArchivos(archivosGuardados);
        } else {
          console.error(data.message);
        }
      } catch (err) {
        console.error('Error al cargar PDFs:', err);
      }
    };

    cargarArchivos();
  }, [directorId, trimestreId, anio]);

  // Extraemos la lógica de subida para usarla tanto al hacer clic como al soltar el archivo
  const procesarArchivos = async (files) => {
    if (!directorId) {
      setError('No se pudo identificar al director. Por favor inicie sesión nuevamente.');
      return;
    }

    if (files.length === 0) return;

    setIsUploading(true);
    setError('');
    setMensaje('');

    const subidosExitosamente = [];

    // Procesar cada archivo individualmente
    for (const file of files) {
      const formData = new FormData();
      formData.append('archivoPdf', file);
      formData.append('director_id', directorId);
      formData.append('anio', anio);
      formData.append('trimestre', trimestreId);

      try {
        const response = await fetch(buildApiUrl('/api/sustentos/upload'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData,
        });
        const data = await response.json();

        if (response.ok && data.success) {
          subidosExitosamente.push({
            id: data.data.id,
            nombre: data.data.nombre_original,
            tamano: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            ruta: data.data.ruta_archivo, // Nos servirá para el botón de Ver
            estado: 'Listo'
          });
        } else {
          throw new Error(data.message || `Error al subir ${file.name}`);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error conectando con el servidor.');
      }
    }

    if (subidosExitosamente.length > 0) {
      setArchivos(prev => [...prev, ...subidosExitosamente]);
      setMensaje(`Se subieron ${subidosExitosamente.length} archivo(s) exitosamente.`);
    }

    setIsUploading(false);
  };

  // Manejador para cuando se selecciona archivo con el botón
  const handleFileUpload = (e) => {
    procesarArchivos(Array.from(e.target.files));
    e.target.value = null; // Resetear input para permitir subir el mismo archivo de nuevo
  };

  // Manejadores para Arrastrar y Soltar (Drag & Drop)
  const handleDragOver = (e) => {
    e.preventDefault(); // Evita que el navegador abra el archivo
    if (trimestreCerrado) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (trimestreCerrado) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); // Evita que el navegador abra el archivo
    if (trimestreCerrado) return;

    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
    if (files.length === 0) {
      setError('Por favor, asegúrate de soltar archivos en formato PDF.');
      return;
    }
    procesarArchivos(files);
  };

  const eliminarArchivo = async (id) => {
    if (trimestreCerrado) return;
    
    setConfirmAction({
      isOpen: true,
      title: 'Eliminar documento',
      message: '¿Estás seguro de que deseas eliminar este documento permanentemente? Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const response = await fetch(buildApiUrl(`/api/sustentos/${id}?directorId=${directorId}`), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const data = await response.json();

          if (response.ok && data.success) {
            setArchivos(archivos.filter(a => a.id !== id));
            setMensaje('Documento eliminado exitosamente.');
          } else {
            throw new Error(data.message || 'Error al eliminar el archivo');
          }
        } catch (err) {
          console.error(err);
          setError(err.message || 'No se pudo conectar con el servidor para eliminar.');
        }
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Toast message={mensaje} type="success" onClose={() => setMensaje('')} />
      <Toast message={error} type="error" onClose={() => setError('')} />

      <div className="bg-white p-8 rounded-[28px] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] border border-slate-200">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6 rounded-3xl border border-slate-300 bg-slate-50/80 p-5 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">
              SUSTENTOS DE GASTO (PDF) - TRIMESTRAL
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              Sube el documento PDF consolidado con todos los sustentos correspondientes a: {etiquetaTrimestre} {anio}.
            </p>
          </div>
        </div>

        {trimestreCerrado && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            Este trimestre está cerrado. Puede revisar y descargar los documentos, pero no subir ni eliminar archivos.
          </div>
        )}

        {/* Zona de Drop principal */}
        <label 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`group flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-3xl transition-all ${
            trimestreCerrado
              ? 'border-slate-300 bg-slate-100/50 cursor-not-allowed opacity-75'
              : isUploading 
                ? 'border-blue-400 bg-blue-50/50 cursor-wait' 
                : isDragging
                  ? 'border-blue-500 bg-blue-100/50 scale-[1.02]' // Efecto visual al arrastrar encima
                  : 'border-slate-300 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-400 cursor-pointer'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
              <p className="mb-2 text-sm text-slate-700 font-bold">Subiendo y guardando archivos...</p>
              <p className="text-xs text-slate-400 font-medium">Por favor, espera un momento</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <div className={`p-4 bg-white shadow-sm border border-slate-200 rounded-2xl mb-4 transition-all duration-300 ${trimestreCerrado ? 'text-slate-400' : 'text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white'}`}>
                {trimestreCerrado ? <CheckCircle size={32} /> : <Upload size={32} />}
              </div>
              <p className="mb-2 text-sm text-slate-700 font-bold">{trimestreCerrado ? 'Subida deshabilitada' : 'Haz clic para subir o arrastra y suelta'}</p>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{trimestreCerrado ? 'Trimestre Finalizado' : 'Solo formato PDF (Máx. 5MB por archivo)'}</p>
            </div>
          )}
          <input type="file" className="hidden" accept=".pdf" multiple onChange={handleFileUpload} disabled={isUploading || trimestreCerrado} />
        </label>

        {/* Lista de Archivos Subidos */}
        <div className="mt-8 rounded-[26px] border border-slate-300 shadow-sm overflow-hidden bg-white">
          <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 uppercase tracking-wide text-sm">Archivos cargados ({archivos.length})</h3>
          </div>
          
          <div className="divide-y divide-slate-100">
            {archivos.length === 0 ? (
              <div className="p-10 text-center text-slate-400 flex flex-col items-center">
                <AlertCircle size={40} className="mb-3 opacity-20" />
                <p className="font-medium text-sm">No hay documentos cargados para este trimestre.</p>
              </div>
            ) : (
              archivos.map(archivo => (
                <div key={archivo.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shadow-sm border border-rose-200">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{archivo.nombre}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                        <span>{archivo.tamano}</span>
                        <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Trimestre Consolidado</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 mr-2">
                      <CheckCircle size={14} /> Listo
                    </span>
                    <a 
                      href={buildApiUrl(archivo.ruta)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 text-slate-400 hover:text-white hover:bg-sky-500 rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Ver documento"
                      onClick={() => {
                        registrarAccion('Sustentos PDF', 'DESCARGAR', `Visualizó/Descargó el archivo ${archivo.nombre}`);
                      }}
                    >
                      <Eye size={18} />
                    </a>
                    {!trimestreCerrado && (
                      <button 
                        onClick={() => eliminarArchivo(archivo.id)}
                        className="p-2.5 text-slate-400 hover:text-white hover:bg-rose-500 rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Eliminar archivo"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmAction.onConfirm}
        title={confirmAction.title}
        message={confirmAction.message}
        confirmText={confirmAction.confirmText}
        isDestructive={confirmAction.isDestructive}
      />
    </div>
  );
};

export default SubirPDFView;