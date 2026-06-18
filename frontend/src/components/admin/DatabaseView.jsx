import React, { useState } from 'react';
import { HardDrive, Database, ShieldAlert, Download } from 'lucide-react';
import { buildApiUrl } from '../../config/api';
import AdminPageHeader from './AdminPageHeader';

const DatabaseView = ({ showToast }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadBackup = async () => {
    setIsDownloading(true);
    
    try {
      // Llamada real al backend
      const response = await fetch(buildApiUrl('/api/admin/backup'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('No se pudo generar el archivo de base de datos.');

      // Convertir la respuesta en un archivo binario descargable
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `UGEL_Database_Backup_${new Date().toISOString().slice(0,10)}.sql`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      setIsDownloading(false);
      showToast('Copia de seguridad descargada con éxito.');
    } catch (error) {
      console.error('Error descargando backup:', error);
      showToast('Error: ' + error.message, 'error');
      setIsDownloading(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        icon={HardDrive}
        title="Gestion de Base de Datos"
        subtitle="Administra respaldos y recursos criticos para restauracion o migracion del sistema."
      />
      
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Tarjeta de Backup */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <Database className="text-amber-500" size={24} />
              <h2 className="text-xl font-bold text-slate-800">Copia de Seguridad (Backup)</h2>
            </div>
            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <p className="text-slate-600 leading-relaxed">
                  Descarga un volcado completo de la base de datos MySQL (estructura y registros). Este archivo <code className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded text-sm">.sql</code> sirve para restaurar el sistema en caso de una emergencia o migración de servidor.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg inline-flex font-medium">
                  <ShieldAlert size={16} />
                  Maneja este archivo con estricta confidencialidad.
                </div>
              </div>
              <button 
                onClick={handleDownloadBackup}
                disabled={isDownloading}
                className="flex-shrink-0 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none border border-blue-400/20"
              >
                {isDownloading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <Download size={24} className="text-amber-300" />
                )}
                {isDownloading ? 'Generando Volcado...' : 'Descargar .SQL'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DatabaseView;

