import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Plus, Save, CalendarDays, X, Download, FileText, PaintBucket } from 'lucide-react';
import { buildApiUrl } from '../../config/api';
import Toast from '../Toast';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import ConfirmModal from './ConfirmModal';

const API_URL = buildApiUrl('/api/movimientos/ingresos');

const crearFilaVacia = () => ({
  id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  fecha: '',
  comprobante_id: '',
  numero: '',
  concepto: '',
  importe: 0,
  color: '',
});

const formatearFechaApi = (fecha) => {
  if (!fecha) return '';
  return String(fecha).split('T')[0];
};

const filaTieneContenido = (fila) => (
  Boolean(fila.fecha)
  || Boolean(String(fila.numero || '').trim())
  || Boolean(String(fila.concepto || '').trim())
  || Number(fila.importe || 0) > 0
  || Boolean(fila.comprobante_id)
);

const leerRespuestaJson = async (response) => {
  const rawText = await response.text();

  try {
    return rawText ? JSON.parse(rawText) : {};
  } catch (error) {
    if (rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<')) {
      throw new Error('El backend no devolvio JSON. Reinicia el servidor backend para cargar las nuevas rutas.');
    }

    throw new Error('La respuesta del servidor no tiene un formato JSON valido.');
  }
};

const IngresosView = ({ trimestreMeses, trimestreId, anio, directorId, trimestreCerrado, schoolName }) => {
  const dateInputRefs = useRef({});
  const [mesActivo, setMesActivo] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [listaComprobantes, setListaComprobantes] = useState([]);
  const [error, setError] = useState('');
  const [filasTipoInvalido, setFilasTipoInvalido] = useState(new Set());
  const [filasFechaInvalida, setFilasFechaInvalida] = useState(new Set());
  const [hayBorradores, setHayBorradores] = useState({ 0: false, 1: false, 2: false });
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [datosMeses, setDatosMeses] = useState([
    [crearFilaVacia()],
    [crearFilaVacia()],
    [crearFilaVacia()],
  ]);
  const [confirmAction, setConfirmAction] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: null,
    isDestructive: false
  });

  // Función para guardar el borrador del mes actual en LocalStorage
  const guardarBorradorMensual = (mesIndex, datosMes) => {
    if (!directorId || !trimestreId || trimestreCerrado) return;
    const key = `draft_ingresos_${directorId}_${trimestreId}_${mesIndex}`;
    localStorage.setItem(key, JSON.stringify(datosMes));
    setHayBorradores((prev) => ({ ...prev, [mesIndex]: true }));
  };

  const descartarBorrador = (mesIndex) => {
    setConfirmAction({
      isOpen: true,
      title: 'Descartar cambios',
      message: '¿Estás seguro de descartar los cambios no guardados? Se recuperarán los datos originales del servidor.',
      confirmText: 'Sí, descartar',
      isDestructive: true,
      onConfirm: () => {
        const key = `draft_ingresos_${directorId}_${trimestreId}_${mesIndex}`;
        localStorage.removeItem(key);
        setHayBorradores((prev) => ({ ...prev, [mesIndex]: false }));
        setReloadTrigger((prev) => prev + 1);
      }
    });
  };

  useEffect(() => {
    const fetchComprobantes = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/comprobantes'), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await leerRespuestaJson(response);
        if (result.success) {
          setListaComprobantes(result.data);
        }
      } catch (error) {
        console.error('Error cargando comprobantes:', error);
      }
    };
    fetchComprobantes();
  }, []);

  useEffect(() => {
    setMesActivo(0);
  }, [trimestreId]);

  const obtenerRangoMes = useCallback((quarterId, monthOffset) => {
    const currentYear = Number(anio);
    const quarterStartMonth = (Number(quarterId) - 1) * 3;
    const monthIndex = quarterStartMonth + monthOffset;
    const startDate = new Date(currentYear, monthIndex, 1);
    const endDate = new Date(currentYear, monthIndex + 1, 0);
    const formatear = (date) => date.toISOString().split('T')[0];

    return {
      startDate: formatear(startDate),
      endDate: formatear(endDate),
      monthNumber: monthIndex,
    };
  }, [anio]);

  useEffect(() => {
    const cargarIngresos = async () => {
      if (!directorId || !trimestreId) return;

      setLoading(true);
      setError('');
      setMensaje('');

      try {
        const primerMes = obtenerRangoMes(trimestreId, 0);
        const ultimoMes = obtenerRangoMes(trimestreId, 2);
        const query = new URLSearchParams({
          directorId: String(directorId),
          startDate: primerMes.startDate,
          endDate: ultimoMes.endDate,
        });

        const response = await fetch(`${API_URL}?${query.toString()}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await leerRespuestaJson(response);

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'No se pudieron cargar los ingresos.');
        }

        const agrupados = [[], [], []];

        data.data.forEach((registro) => {
          const fecha = new Date(registro.fecha);
          const monthOffset = fecha.getMonth() - primerMes.monthNumber;

          if (monthOffset >= 0 && monthOffset < 3) {
            agrupados[monthOffset].push({
              id: registro.id,
              fecha: formatearFechaApi(registro.fecha),
              comprobante_id: registro.comprobante_id || '',
              numero: registro.numero_comprobante || '',
              concepto: registro.concepto || '',
              importe: registro.monto ?? 0,
              color: registro.color || '',
            });
          }
        });

        const borradoresEncontrados = { 0: false, 1: false, 2: false };

        // Mezclar datos de la BD con los borradores locales si existen
        const baseDatosMeses = agrupados.map((mesRegistros, index) => {
          const key = `draft_ingresos_${directorId}_${trimestreId}_${index}`;
          const draftStr = localStorage.getItem(key);
          
          if (draftStr && !trimestreCerrado) {
            try {
              borradoresEncontrados[index] = true;
              return JSON.parse(draftStr);
            } catch (e) {
              // Si el JSON falla, usamos los del backend
            }
          }
          return mesRegistros.length > 0 ? mesRegistros : [crearFilaVacia()];
        });

        setHayBorradores(borradoresEncontrados);
        setDatosMeses(baseDatosMeses);
      } catch (loadError) {
        console.error(loadError);
        setError(loadError.message || 'Error cargando los ingresos.');
      } finally {
        setLoading(false);
      }
    };

    cargarIngresos();
  }, [directorId, trimestreId, reloadTrigger, trimestreCerrado, obtenerRangoMes]);

  const handleInputChange = (mesIndex, filaId, campo, valor) => {
    setDatosMeses((prevDatos) => {
      const nuevosDatos = [...prevDatos];
      nuevosDatos[mesIndex] = nuevosDatos[mesIndex].map((fila) => (
        fila.id === filaId ? { ...fila, [campo]: valor } : fila
      ));
      guardarBorradorMensual(mesIndex, nuevosDatos[mesIndex]);
      return nuevosDatos;
    });

    if (campo === 'comprobante_id' && valor) {
      setFilasTipoInvalido((prev) => {
        if (!prev.has(filaId)) return prev;
        const next = new Set(prev);
        next.delete(filaId);
        return next;
      });
    }

    if (campo === 'fecha' && valor) {
      setFilasFechaInvalida((prev) => {
        if (!prev.has(filaId)) return prev;
        const next = new Set(prev);
        next.delete(filaId);
        return next;
      });
    }
  };

  const agregarFila = (mesIndex) => {
    if (trimestreCerrado) return;

    setDatosMeses((prevDatos) => {
      const nuevosDatos = [...prevDatos];
      nuevosDatos[mesIndex] = [...nuevosDatos[mesIndex], crearFilaVacia()];
      guardarBorradorMensual(mesIndex, nuevosDatos[mesIndex]);
      return nuevosDatos;
    });
  };

  const eliminarFila = (mesIndex, filaId) => {
    if (trimestreCerrado) return;

    setDatosMeses((prevDatos) => {
      const nuevosDatos = [...prevDatos];
      const filtradas = nuevosDatos[mesIndex].filter((fila) => fila.id !== filaId);
      nuevosDatos[mesIndex] = filtradas.length > 0 ? filtradas : [crearFilaVacia()];
      guardarBorradorMensual(mesIndex, nuevosDatos[mesIndex]);
      return nuevosDatos;
    });
  };

  const calcularTotal = (mesIndex) => (
    datosMeses[mesIndex].reduce((sum, fila) => sum + parseFloat(fila.importe || 0), 0)
  );

  const formatearFechaDDMM = (fecha) => {
    if (!fecha) return '';
    const [, mes, dia] = fecha.split('-');
    return `${dia}-${mes}`;
  };

  const abrirSelectorFecha = (filaId) => {
    const input = dateInputRefs.current[filaId];
    if (!input) return;

    input.focus({ preventScroll: true });
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.click();
  };

  const guardarMesActual = async () => {
    if (trimestreCerrado) {
      setError('Este trimestre está cerrado y no admite cambios.');
      return;
    }

    if (!directorId) {
      setError('No se encontró el director logueado.');
      return;
    }

    const { startDate, endDate } = obtenerRangoMes(trimestreId, mesActivo);
    // Solo enviamos al backend las filas que tienen contenido real
    const registros = datosMeses[mesActivo]
      .filter((fila) => filaTieneContenido(fila))
      .map((fila) => ({
        fecha: fila.fecha,
        comprobante_id: fila.comprobante_id,
        numero_comprobante: fila.numero,
        concepto: fila.concepto,
        monto: fila.importe,
        color: fila.color,
      }));

    const filasSinTipo = datosMeses[mesActivo]
      .map((fila, index) => ({ fila, index }))
      .filter(({ fila }) => filaTieneContenido(fila) && !fila.comprobante_id)
      .map(({ index }) => index + 1);
    const filaIdsSinTipo = datosMeses[mesActivo]
      .filter((fila) => filaTieneContenido(fila) && !fila.comprobante_id)
      .map((fila) => fila.id);

    // Validar que las filas con contenido tengan una fecha establecida
    const filasSinFecha = datosMeses[mesActivo]
      .map((fila, index) => ({ fila, index }))
      .filter(({ fila }) => filaTieneContenido(fila) && (!fila.fecha || String(fila.fecha).trim() === ''))
      .map(({ index }) => index + 1);
    const filaIdsSinFecha = datosMeses[mesActivo]
      .filter((fila) => filaTieneContenido(fila) && (!fila.fecha || String(fila.fecha).trim() === ''))
      .map((fila) => fila.id);

    if (filasSinFecha.length > 0) {
      setFilasFechaInvalida(new Set(filaIdsSinFecha));
      setError(`La fecha es obligatoria en la(s) fila(s): ${filasSinFecha.join(', ')}.`);
      return; // Detiene el guardado
    }

    if (filasSinTipo.length > 0) {
      setFilasTipoInvalido(new Set(filaIdsSinTipo));
      setError(`Selecciona el Tipo de Comprobante en la(s) fila(s): ${filasSinTipo.join(', ')}.`);
      return;
    }

    setSaving(true);
    setFilasTipoInvalido(new Set());
    setFilasFechaInvalida(new Set());
    setError('');
    setMensaje('');

    try {
      const response = await fetch(`${API_URL}/replace-range`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          directorId,
          startDate,
          endDate,
          registros,
        }),
      });

      const data = await leerRespuestaJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo guardar el mes actual.');
      }

      setMensaje(`Se guardaron ${data.totalGuardados} registro(s) de ${trimestreMeses[mesActivo]}.`);
      
      const key = `draft_ingresos_${directorId}_${trimestreId}_${mesActivo}`;
      localStorage.removeItem(key);
      setHayBorradores((prev) => ({ ...prev, [mesActivo]: false }));
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message || 'Error guardando los ingresos.');
    } finally {
      setSaving(false);
    }
  };

  const declararSinMovimientos = () => {
    if (trimestreCerrado) return;

    setConfirmAction({
      isOpen: true,
      title: 'Declarar Mes en Cero',
      message: `¿Estás seguro de declarar S/. 0.00 de ingresos para el mes de ${trimestreMeses[mesActivo]}? Se borrarán las filas actuales si las hubiera.`,
      confirmText: 'Sí, declarar en cero',
      isDestructive: true,
      onConfirm: async () => {
        setSaving(true);
        setError('');
        setMensaje('');

        try {
          const { startDate, endDate } = obtenerRangoMes(trimestreId, mesActivo);
          const response = await fetch(`${API_URL}/replace-range`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              directorId,
              startDate,
              endDate,
              registros: [],
            }),
          });

          const data = await leerRespuestaJson(response);

          if (!response.ok || !data.success) {
            throw new Error(data.message || 'No se pudo declarar en cero.');
          }

          setMensaje(`Se declaró sin movimientos el mes de ${trimestreMeses[mesActivo]}.`);
          const key = `draft_ingresos_${directorId}_${trimestreId}_${mesActivo}`;
          localStorage.removeItem(key);
          setHayBorradores((prev) => ({ ...prev, [mesActivo]: false }));
          setReloadTrigger(prev => prev + 1);
        } catch (saveError) {
          console.error(saveError);
          setError(saveError.message || 'Error al declarar en cero.');
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const obtenerNombreComprobante = (id) => {
    const comp = listaComprobantes.find(c => String(c.id) === String(id));
    return comp ? comp.nombre : '';
  };

  // Funciones placeholder para la exportación
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`RELACIÓN DE INGRESOS - ${trimestreMeses[mesActivo].toUpperCase()} ${anio}`, 14, 20);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión de Recursos Propios', 14, 28);

    // Filtrar filas válidas y mapear datos
    const tableData = datosMeses[mesActivo]
      .filter(fila => filaTieneContenido(fila))
      .map((fila, index) => [
        index + 1,
        fila.fecha ? formatearFechaDDMM(fila.fecha) : '',
        obtenerNombreComprobante(fila.comprobante_id),
        fila.numero || '',
        fila.concepto || '',
        `S/. ${Number(fila.importe || 0).toFixed(2)}`
      ]);

    autoTable(doc, {
      startY: 35,
      head: [['N°', 'Fecha', 'Tipo Comprobante', 'N° Comprobante', 'Concepto', 'Importe']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }, // Color blue-600
      foot: [['', '', '', '', 'TOTAL INGRESOS', `S/. ${calcularTotal(mesActivo).toFixed(2)}`]],
      footStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } // slate-900
    });

    const nombreSeguro = (schoolName || 'IE').replace(/["<>|:*?\\/]/g, '').trim().replace(/\s+/g, '_');
    doc.save(`Ingresos_${trimestreMeses[mesActivo]}_${nombreSeguro}.pdf`);
  };

  const handleDownloadExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Ingresos', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 5 }] // Congela cabecera
    });

    // Intento de cargar logo de la UGEL
    try {
      const logoRes = await fetch('https://ugelsanta.gob.pe/wp-content/uploads/2026/02/Logo_US3.png');
      const logoBuffer = await logoRes.arrayBuffer();
      const logoId = wb.addImage({ buffer: logoBuffer, extension: 'png' });
      ws.addImage(logoId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 90, height: 35 } });
    } catch (e) {
      console.log('El logo no se pudo incrustar (CORS protegido por el servidor UGEL). Se omitirá.');
    }

    ws.columns = [
      { header: '', key: 'n', width: 5 },
      { header: '', key: 'fecha', width: 15 },
      { header: '', key: 'tipo', width: 25 },
      { header: '', key: 'num', width: 20 },
      { header: '', key: 'concepto', width: 40 },
      { header: '', key: 'importe', width: 18 }
    ];

    ws.mergeCells('A1:F1');
    ws.getCell('A1').value = `RELACIÓN DE INGRESOS - ${trimestreMeses[mesActivo].toUpperCase()} ${anio}`;
    ws.getCell('A1').font = { size: 14, bold: true };
    ws.getCell('A1').alignment = { horizontal: 'center' };
    
    ws.mergeCells('A2:F2');
    ws.getCell('A2').value = 'Sistema de Gestión de Recursos Propios';
    ws.getCell('A2').alignment = { horizontal: 'center' };

    ws.addRow([]); ws.addRow([]); // Espacio debajo del título

    const headerRow = ws.addRow(['N°', 'Fecha', 'Tipo Comprobante', 'N° Comprobante', 'Concepto', 'Importe']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }; // blue-600
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });

    datosMeses[mesActivo].filter(fila => filaTieneContenido(fila)).forEach((fila, index) => {
      const row = ws.addRow([ index + 1, fila.fecha ? formatearFechaDDMM(fila.fecha) : '', obtenerNombreComprobante(fila.comprobante_id), fila.numero || '', fila.concepto || '', Number(fila.importe || 0) ]);
      row.getCell(6).numFmt = '"S/." #,##0.00';
      row.eachCell(c => {
        c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
        if (fila.color) {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + fila.color.replace('#', '').toUpperCase() } };
        }
      });
    });

    const rowTotal = ws.addRow(['', '', '', '', 'TOTAL INGRESOS', Number(calcularTotal(mesActivo))]);
    rowTotal.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    rowTotal.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    rowTotal.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    rowTotal.getCell(6).numFmt = '"S/." #,##0.00';
    rowTotal.eachCell({ includeEmpty: false }, c => c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const nombreSeguro = (schoolName || 'IE').replace(/["<>|:*?\\/]/g, '').trim().replace(/\s+/g, '_');
    link.download = `Ingresos_${trimestreMeses[mesActivo]}_${nombreSeguro}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const inputClass = 'w-full p-2 outline-none bg-transparent text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 rounded transition-all';

  const limitesMesActivo = obtenerRangoMes(trimestreId, mesActivo);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-[28px] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] border border-slate-200">
        <div className="flex gap-2 mb-8 bg-slate-50 p-2 rounded-2xl border border-slate-200 overflow-x-auto">
        {trimestreMeses.map((mes, index) => (
          <button
            key={mes}
            onClick={() => setMesActivo(index)}
            className={`flex-1 px-6 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              mesActivo === index
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <CalendarDays size={18} />
            {mes.toUpperCase()}
            {hayBorradores[index] && (
              <span className="flex h-2.5 w-2.5 relative ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" title="Borrador local sin guardar"></span>
              </span>
            )}
          </button>
        ))}
      </div>

        <div className="flex justify-between items-center mb-6 rounded-3xl border border-slate-300 bg-slate-50/80 p-5 shadow-sm">
          <h2 className="text-[15px] font-black uppercase tracking-[0.14em] text-slate-900">
            <span className="text-blue-700">Relación de ingresos</span>
            <span className="mx-2 text-slate-300">/</span>
            <span>{trimestreMeses[mesActivo]} {anio}</span>
          </h2>
          
          <div className="flex items-center gap-3">
            {!trimestreCerrado && (
              <button
                type="button"
                onClick={declararSinMovimientos}
                disabled={saving || loading}
                className="flex items-center gap-2 bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm hover:bg-slate-300 transition-all font-bold shadow-sm disabled:opacity-50"
              >
                Declarar Mes en Cero
              </button>
            )}
          </div>
        </div>

        {trimestreCerrado && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            Este trimestre está cerrado. Puede revisar la información, pero no editarla.
          </div>
        )}

        {loading && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Cargando ingresos del trimestre...
          </div>
        )}

        {hayBorradores[mesActivo] && !trimestreCerrado && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 text-amber-800">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <p className="text-sm font-bold">Tienes un borrador local con cambios sin guardar en este mes.</p>
            </div>
            <button
              onClick={() => descartarBorrador(mesActivo)}
              className="text-sm text-amber-700 hover:text-amber-900 hover:underline font-bold transition-colors"
            >
              Descartar cambios
            </button>
          </div>
        )}

      <Toast message={mensaje} type="success" onClose={() => setMensaje('')} />
      <Toast message={error} type="error" onClose={() => setError('')} />

        <div className="overflow-x-auto rounded-[26px] border border-slate-300 shadow-sm">
          <table className="w-full border-collapse bg-white text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-sky-600 text-white">
                <th className="border border-blue-700/50 px-4 py-3 font-bold uppercase tracking-wider w-12 text-center text-xs">N°</th>
                <th className="border border-blue-700/50 px-4 py-3 font-bold uppercase tracking-wider w-28 text-center text-xs">Fecha</th>
                <th className="border border-blue-700/50 px-4 py-3 font-bold uppercase tracking-wider w-40 text-center text-xs">Tipo Comprobante</th>
                <th className="border border-blue-700/50 px-4 py-3 font-bold uppercase tracking-wider w-36 text-center text-xs">N° Comprobante</th>
                <th className="border border-blue-700/50 px-4 py-3 font-bold uppercase tracking-wider text-left text-xs">Concepto</th>
                <th className="border border-blue-700/50 px-4 py-3 font-bold uppercase tracking-wider w-36 text-right text-xs">Importe (S/.)</th>
                <th className="border border-blue-700/50 px-4 py-3 font-bold uppercase tracking-wider w-24 text-center text-xs">Acción</th>
              </tr>
            </thead>
            <tbody>
              {datosMeses[mesActivo].map((fila, index) => (
                <tr key={fila.id} style={{ backgroundColor: fila.color || undefined }} className="hover:bg-slate-50/80 transition-colors group/row">
                  <td className="border border-slate-300 px-2 py-2 text-center font-medium text-slate-500" style={{ backgroundColor: fila.color || '#f8fafc' }}>{index + 1}</td>
                  <td className="border border-slate-300 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!trimestreCerrado) abrirSelectorFecha(fila.id);
                      }}
                      disabled={trimestreCerrado}
                      className="relative block w-full text-left cursor-pointer group disabled:cursor-not-allowed"
                      title="Seleccionar fecha"
                    >
                      <input
                        type="date"
                        ref={(element) => {
                          if (element) {
                            dateInputRefs.current[fila.id] = element;
                          } else {
                            delete dateInputRefs.current[fila.id];
                          }
                        }}
                        min={limitesMesActivo.startDate}
                        max={limitesMesActivo.endDate}
                        value={fila.fecha}
                        onChange={(e) => handleInputChange(mesActivo, fila.id, 'fecha', e.target.value)}
                        disabled={trimestreCerrado}
                        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                      <span className={`block w-full p-2 text-center font-mono text-sm font-medium rounded transition-colors pointer-events-none ${
                        filasFechaInvalida.has(fila.id)
                          ? 'bg-red-50 text-red-600 ring-2 ring-red-500 group-hover:bg-red-100'
                          : 'text-slate-700 group-hover:bg-slate-200'
                      }`}>
                        {fila.fecha ? formatearFechaDDMM(fila.fecha) : '--'}
                      </span>
                    </button>
                    {filasFechaInvalida.has(fila.id) && (
                      <p className="px-1 pt-1 text-xs text-red-600 text-center">Requerido</p>
                    )}
                  </td>
                  <td className="border border-slate-300 p-1">
                    <select
                      value={fila.comprobante_id}
                      onChange={(e) => handleInputChange(mesActivo, fila.id, 'comprobante_id', e.target.value)}
                      disabled={trimestreCerrado}
                      className={`${inputClass} ${filasTipoInvalido.has(fila.id) ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                    >
                      <option value="">Seleccionar</option>
                      {listaComprobantes.map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          {comp.nombre}
                        </option>
                      ))}
                    </select>
                    {filasTipoInvalido.has(fila.id) && (
                      <p className="px-1 pt-1 text-xs text-red-600">Campo obligatorio</p>
                    )}
                  </td>
                  <td className="border border-slate-300 p-1">
                    <input
                      type="text"
                      value={fila.numero}
                      onChange={(e) => handleInputChange(mesActivo, fila.id, 'numero', e.target.value)}
                      disabled={trimestreCerrado}
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-slate-300 p-1">
                    <input
                      type="text"
                      value={fila.concepto}
                      onChange={(e) => handleInputChange(mesActivo, fila.id, 'concepto', e.target.value)}
                      disabled={trimestreCerrado}
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-slate-300 p-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                      value={fila.importe}
                      onChange={(e) => {
                        if (Number(e.target.value) >= 0) {
                          handleInputChange(mesActivo, fila.id, 'importe', e.target.value);
                        }
                      }}
                      disabled={trimestreCerrado}
                      className={`${inputClass} text-right font-mono text-base`}
                    />
                  </td>
                  <td className="border border-slate-300 p-1 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="relative group/color flex items-center justify-center">
                        <label className={`cursor-pointer ${fila.color ? 'bg-white' : 'bg-slate-100'} text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-all border border-slate-300 shadow-sm`} title="Resaltar fila">
                          <PaintBucket size={16} color={fila.color || 'currentColor'} />
                          <input
                            type="color"
                            value={fila.color || '#ffffff'}
                            onChange={(e) => handleInputChange(mesActivo, fila.id, 'color', e.target.value)}
                            disabled={trimestreCerrado}
                            className="opacity-0 absolute w-0 h-0"
                          />
                        </label>
                        {fila.color && !trimestreCerrado && (
                          <button
                            type="button"
                            onClick={() => handleInputChange(mesActivo, fila.id, 'color', '')}
                            className="absolute -top-1.5 -right-1.5 bg-rose-100 text-rose-600 rounded-full p-0.5 hover:bg-rose-200 shadow-sm"
                            title="Quitar color"
                          >
                            <X size={10} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => eliminarFila(mesActivo, fila.id)}
                        disabled={trimestreCerrado}
                        className="bg-slate-400 text-white p-1.5 rounded-lg hover:bg-rose-600 transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                        title="Eliminar fila"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-900 text-white font-bold">
                <td colSpan="5" className="border border-slate-700 px-4 py-3 text-right uppercase tracking-wider text-xs">
                  Total {trimestreMeses[mesActivo]}
                </td>
                <td className="border border-slate-700 px-4 py-3 text-right font-mono text-base text-white">
                  {new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2 }).format(calcularTotal(mesActivo))}
                </td>
                <td className="border border-slate-700 px-4 py-3 bg-slate-900"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => agregarFila(mesActivo)}
              disabled={trimestreCerrado}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl hover:bg-blue-700 transition-all shadow-lg font-bold uppercase tracking-wide text-sm disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Plus size={20} /> Agregar Fila
            </button>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-2 bg-white text-red-600 border border-red-200 px-6 py-3.5 rounded-2xl hover:bg-red-50 transition-all shadow-sm font-bold uppercase tracking-wide text-sm"
            >
              <FileText size={20} /> Descargar PDF
            </button>
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="flex items-center justify-center gap-2 bg-white text-blue-700 border border-blue-200 px-6 py-3.5 rounded-2xl hover:bg-blue-50 transition-all shadow-sm font-bold uppercase tracking-wide text-sm"
            >
              <Download size={20} /> Descargar Excel
            </button>
            <button
              type="button"
              onClick={guardarMesActual}
              disabled={saving || loading || trimestreCerrado}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg disabled:bg-slate-400 uppercase tracking-wide text-sm"
            >
              <Save size={20} /> {saving ? 'Guardando...' : 'Guardar Mes Actual'}
            </button>
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

export default IngresosView;
