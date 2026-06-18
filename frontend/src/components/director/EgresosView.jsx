import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Plus, Save, CalendarDays, Download, FileText, Trash2 } from 'lucide-react';
import { buildApiUrl } from '../../config/api';
import Toast from '../Toast';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import ConfirmModal from './ConfirmModal';
import { UGEL_LOGO_SRC } from '../../config/assets';

const API_URL = buildApiUrl('/api/movimientos/egresos');

const crearFilaVacia = () => ({
  id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  fecha: '',
  comprobante_id: '',
  serie: '',
  numero: '',
  concepto: '',
  importe: '',
});

const normalizarImporte = (value) => {
  const raw = String(value ?? '').replace(/[^\d.]/g, '');
  const hasDecimal = raw.includes('.');
  const [integerPart = '', ...decimalParts] = raw.split('.');
  const integer = integerPart.replace(/^0+(?=\d)/, '');
  const decimal = decimalParts.join('').slice(0, 2);

  if (hasDecimal) return `${integer || '0'}.${decimal}`;
  return integer;
};

const formatearFechaApi = (fecha) => {
  if (!fecha) return '';
  return String(fecha).split('T')[0];
};

const filaTieneContenido = (fila) => (
  Boolean(fila.fecha)
  || Boolean(String(fila.serie || '').trim())
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

const EgresosView = ({ trimestreMeses, trimestreId, anio, directorId, trimestreCerrado, schoolName }) => {
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
    const key = `draft_egresos_${directorId}_${trimestreId}_${mesIndex}`;
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
        const key = `draft_egresos_${directorId}_${trimestreId}_${mesIndex}`;
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
    const cargarEgresos = async () => {
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
          throw new Error(data.message || 'No se pudieron cargar los egresos.');
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
              serie: registro.serie || '',
              numero: registro.numero_comprobante || '',
              concepto: registro.concepto || '',
              importe: registro.monto ?? 0,
            });
          }
        });

        const borradoresEncontrados = { 0: false, 1: false, 2: false };

        // Mezclar datos de la BD con los borradores locales si existen
        const baseDatosMeses = agrupados.map((mesRegistros, index) => {
          const key = `draft_egresos_${directorId}_${trimestreId}_${index}`;
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
        setError(loadError.message || 'Error cargando los egresos.');
      } finally {
        setLoading(false);
      }
    };

    cargarEgresos();
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

  const formatearTotalMensual = (mesIndex) => (
    new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(calcularTotal(mesIndex))
  );

  const formatearFechaDDMM = (fecha) => {
    if (!fecha) return '';
    const [, mes, dia] = fecha.split('-');
    const mesesAbreviados = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const mesTexto = mesesAbreviados[Number(mes) - 1] || mes;
    return `${dia}-${mesTexto}`;
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
      setError('Este trimestre esta cerrado y no admite cambios.');
      return;
    }

    if (!directorId) {
      setError('No se encontro el director logueado.');
      return;
    }

    const { startDate, endDate } = obtenerRangoMes(trimestreId, mesActivo);
    // Solo enviamos al backend las filas que tienen contenido real
    const registros = datosMeses[mesActivo]
      .filter((fila) => filaTieneContenido(fila))
      .map((fila) => ({
        fecha: fila.fecha,
        comprobante_id: fila.comprobante_id,
        serie: fila.serie,
        numero_comprobante: fila.numero,
        concepto: fila.concepto,
        monto: Number(fila.importe || 0),
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
      
      const key = `draft_egresos_${directorId}_${trimestreId}_${mesActivo}`;
      localStorage.removeItem(key);
      setHayBorradores((prev) => ({ ...prev, [mesActivo]: false }));
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message || 'Error guardando los egresos.');
    } finally {
      setSaving(false);
    }
  };

  const obtenerNombreComprobante = (id) => {
    const comp = listaComprobantes.find(c => String(c.id) === String(id));
    return comp ? comp.nombre : '';
  };

  // Funciones placeholder para la exportación
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const addInvalidWatermark = () => {
      const totalPages = doc.getNumberOfPages();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const stampWidth = 158;
      const stampHeight = 42;
      const stampX = (pageWidth - stampWidth) / 2;
      const stampY = (pageHeight - stampHeight) / 2;

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        doc.setPage(pageNumber);
        doc.setDrawColor(190, 18, 60);
        doc.setLineWidth(1.4);
        doc.roundedRect(stampX, stampY, stampWidth, stampHeight, 5, 5, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(46);
        doc.setTextColor(190, 18, 60);
        doc.text('INVALIDO', pageWidth / 2, stampY + 29, { align: 'center' });
      }
    };
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`RELACIÓN DE EGRESOS - ${trimestreMeses[mesActivo].toUpperCase()} ${anio}`, 14, 20);
    
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
        fila.serie || '',
        fila.numero || '',
        fila.concepto || '',
        `S/. ${Number(fila.importe || 0).toFixed(2)}`
      ]);

    autoTable(doc, {
      startY: 35,
      head: [
        [
          { content: 'N°', rowSpan: 2 },
          { content: 'Fecha', rowSpan: 2 },
          { content: 'Comprobante', colSpan: 3, styles: { halign: 'center' } },
          { content: 'Concepto', rowSpan: 2 },
          { content: 'Importe', rowSpan: 2 },
        ],
        ['Tipo', 'Serie', 'N°'],
      ],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [225, 29, 72] }, // Color rose-600
      foot: [['', '', '', '', '', 'TOTAL EGRESOS', `S/. ${calcularTotal(mesActivo).toFixed(2)}`]],
      footStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } // slate-900
    });

    const pageMargin = 14;
    const pageHeight = doc.internal.pageSize.getHeight();
    let signatureY = doc.lastAutoTable.finalY + 18;
    if (signatureY > pageHeight - 28) {
      doc.addPage();
      signatureY = 60;
    }

    const signatureWidth = 68;
    const leftSignatureX = pageMargin + 10;
    const rightSignatureX = doc.internal.pageSize.getWidth() - pageMargin - 10 - signatureWidth;

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.35);
    doc.line(leftSignatureX, signatureY, leftSignatureX + signatureWidth, signatureY);
    doc.line(rightSignatureX, signatureY, rightSignatureX + signatureWidth, signatureY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Director', leftSignatureX + (signatureWidth / 2), signatureY + 6, { align: 'center' });
    doc.text('Tesorero', rightSignatureX + (signatureWidth / 2), signatureY + 6, { align: 'center' });

    if (!trimestreCerrado) {
      addInvalidWatermark();
    }

    const nombreSeguro = (schoolName || 'IE').replace(/["<>|:*?\\/]/g, '').trim().replace(/\s+/g, '_');
    doc.save(`Egresos_${trimestreMeses[mesActivo]}_${nombreSeguro}.pdf`);
  };

  const handleDownloadExcel = async () => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sistema de Gestion de Recursos Propios - UGEL';
    wb.created = new Date();
    wb.modified = new Date();

    const ws = wb.addWorksheet('Egresos', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 6, showGridLines: false }]
    });
    ws.properties.defaultRowHeight = 22;
    ws.pageSetup = {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: { left: 0.25, right: 0.25, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2 }
    };

    // Intento de cargar logo de la UGEL
    try {
      const logoRes = await fetch(UGEL_LOGO_SRC);
      const logoBuffer = await logoRes.arrayBuffer();
      const logoId = wb.addImage({ buffer: logoBuffer, extension: 'png' });
      ws.addImage(logoId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 90, height: 35 } });
    } catch (e) {
      console.log('El logo local no se pudo incrustar. Se omitira.');
    }

    ws.columns = [
      { header: '', key: 'n', width: 7 },
      { header: '', key: 'fecha', width: 14 },
      { header: '', key: 'tipo', width: 25 },
      { header: '', key: 'serie', width: 14 },
      { header: '', key: 'num', width: 16 },
      { header: '', key: 'concepto', width: 48 },
      { header: '', key: 'importe', width: 18 }
    ];

    ws.mergeCells('A1:G1');
    ws.getCell('A1').value = `RELACIÓN DE EGRESOS - ${trimestreMeses[mesActivo].toUpperCase()} ${anio}`;
    ws.getCell('A1').font = { name: 'Arial', size: 15, bold: true, color: { argb: 'FF0F172A' } };
    ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 28;
    
    ws.mergeCells('A2:G2');
    ws.getCell('A2').value = 'Sistema de Gestión de Recursos Propios';
    ws.getCell('A2').font = { name: 'Arial', size: 11, color: { argb: 'FF334155' } };
    ws.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 20;

    ws.addRow([]); ws.addRow([]);

    const headerTopRow = ws.addRow(['N°', 'Fecha', 'Comprobante', '', '', 'Concepto', 'Importe']);
    const headerSubRow = ws.addRow(['', '', 'Tipo', 'Serie', 'N°', '', '']);
    ws.mergeCells(`A${headerTopRow.number}:A${headerSubRow.number}`);
    ws.mergeCells(`B${headerTopRow.number}:B${headerSubRow.number}`);
    ws.mergeCells(`C${headerTopRow.number}:E${headerTopRow.number}`);
    ws.mergeCells(`F${headerTopRow.number}:F${headerSubRow.number}`);
    ws.mergeCells(`G${headerTopRow.number}:G${headerSubRow.number}`);
    [headerTopRow, headerSubRow].forEach((row) => {
      row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE11D48' } }; // rose-600
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      });
    });
    headerTopRow.height = 24;
    headerSubRow.height = 22;

    datosMeses[mesActivo].filter(fila => filaTieneContenido(fila)).forEach((fila, index) => {
      const row = ws.addRow([ index + 1, fila.fecha ? formatearFechaDDMM(fila.fecha) : '', obtenerNombreComprobante(fila.comprobante_id), fila.serie || '', fila.numero || '', fila.concepto || '', Number(fila.importe || 0) ]);
      row.getCell(7).numFmt = '"S/." #,##0.00';
      row.eachCell((c, columnNumber) => {
        c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
        c.alignment = {
          horizontal: columnNumber === 6 ? 'left' : columnNumber === 7 ? 'right' : 'center',
          vertical: 'middle',
          wrapText: true
        };
        if (index % 2 === 1) {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      });
    });

    const rowTotal = ws.addRow(['', '', '', '', '', 'TOTAL EGRESOS', Number(calcularTotal(mesActivo))]);
    rowTotal.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    rowTotal.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    rowTotal.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    rowTotal.getCell(7).numFmt = '"S/." #,##0.00';
    rowTotal.eachCell({ includeEmpty: false }, (c, columnNumber) => {
      c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      c.alignment = { horizontal: columnNumber === 7 ? 'right' : 'center', vertical: 'middle' };
    });
    rowTotal.height = 24;

    const signatureRowNumber = rowTotal.number + 4;
    ws.getCell(`B${signatureRowNumber}`).border = { bottom: { style: 'thin', color: { argb: 'FF0F172A' } } };
    ws.getCell(`F${signatureRowNumber}`).border = { bottom: { style: 'thin', color: { argb: 'FF0F172A' } } };
    ws.getCell(`B${signatureRowNumber + 1}`).value = 'Director';
    ws.getCell(`F${signatureRowNumber + 1}`).value = 'Tesorero';
    ['B', 'F'].forEach((column) => {
      ws.getCell(`${column}${signatureRowNumber + 1}`).font = { bold: true, color: { argb: 'FF0F172A' } };
      ws.getCell(`${column}${signatureRowNumber + 1}`).alignment = { horizontal: 'center' };
    });

    if (!trimestreCerrado) {
      ws.mergeCells('A4:G4');
      const watermarkCell = ws.getCell('A4');
      watermarkCell.value = 'INVALIDO';
      watermarkCell.font = { bold: true, size: 18, color: { argb: 'FFBE123C' } };
      watermarkCell.alignment = { horizontal: 'center', vertical: 'middle' };
      watermarkCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } };
      ws.getRow(4).height = 28;
    }

    ws.autoFilter = { from: { row: headerSubRow.number, column: 1 }, to: { row: rowTotal.number, column: 7 } };
    ws.pageSetup.printArea = `A1:G${ws.lastRow.number}`;

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const nombreSeguro = (schoolName || 'IE').replace(/["<>|:*?\\/]/g, '').trim().replace(/\s+/g, '_');
    link.download = `Egresos_${trimestreMeses[mesActivo]}_${nombreSeguro}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const inputClass = 'w-full p-2 outline-none bg-transparent text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-rose-500/20 rounded transition-all';

  const limitesMesActivo = obtenerRangoMes(trimestreId, mesActivo);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-[28px] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] border border-slate-200 dark:border-slate-700 dark:bg-slate-800/95">
        <div className="flex gap-2 mb-8 bg-slate-50 p-2 rounded-2xl border border-slate-200 overflow-x-auto dark:border-slate-700 dark:bg-slate-900/50">
        {trimestreMeses.map((mes, index) => (
          <button
            key={mes}
            onClick={() => setMesActivo(index)}
            className={`min-w-[180px] flex-1 rounded-xl px-5 py-3 text-left transition-all ${
              mesActivo === index
                ? 'bg-white text-rose-700 shadow-sm border border-slate-200 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            <span className="flex w-full items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em]">
                <CalendarDays size={18} />
                {mes.toUpperCase()}
              </span>
              {hayBorradores[index] && (
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" title="Borrador local sin guardar"></span>
                </span>
              )}
            </span>
            <span className={`mt-1.5 block text-[11px] font-extrabold uppercase tracking-[0.14em] ${
              mesActivo === index ? 'text-rose-600 dark:text-rose-200' : 'text-slate-400 dark:text-slate-500'
            }`}>
              Total S/. {formatearTotalMensual(index)}
            </span>
          </button>
        ))}
      </div>

        <div className="flex items-center mb-6 rounded-3xl border border-slate-300 bg-slate-50/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/45">
          <h2 className="text-[15px] font-black uppercase tracking-[0.14em] text-slate-900 dark:text-slate-100">
            <span className="text-rose-700 dark:text-rose-300">Relación de egresos</span>
            <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
            <span>{trimestreMeses[mesActivo]} {anio}</span>
          </h2>

        </div>

        {trimestreCerrado && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Este trimestre esta cerrado. Puede revisar la informacion, pero no editarla.
          </div>
        )}

        {loading && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
            Cargando egresos del trimestre...
          </div>
        )}

        {hayBorradores[mesActivo] && !trimestreCerrado && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <p className="text-sm font-bold">Tienes un borrador local con cambios sin guardar en este mes.</p>
            </div>
            <button
              onClick={() => descartarBorrador(mesActivo)}
              className="text-sm text-amber-700 hover:text-amber-900 hover:underline font-bold transition-colors dark:text-amber-200 dark:hover:text-amber-100"
            >
              Descartar cambios
            </button>
          </div>
        )}

      <Toast message={mensaje} type="success" onClose={() => setMensaje('')} />
      <Toast message={error} type="error" onClose={() => setError('')} />

        <div className="overflow-x-auto rounded-[26px] border border-slate-300 shadow-sm dark:border-slate-600 dark:shadow-[0_18px_50px_-28px_rgba(0,0,0,0.9)]">
          <table className="w-full border-collapse bg-white text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-rose-600 to-red-600 text-white">
                <th rowSpan="2" className="border border-rose-700/50 px-4 py-3 align-middle text-center text-[11px] font-black uppercase leading-5 tracking-[0.14em] text-white/95 w-12">N°</th>
                <th rowSpan="2" className="border border-rose-700/50 px-4 py-3 align-middle text-center text-[11px] font-black uppercase leading-5 tracking-[0.14em] text-white/95 w-28">Fecha</th>
                <th colSpan="3" className="border border-rose-700/50 px-4 py-3 align-middle text-center text-[11px] font-black uppercase leading-5 tracking-[0.14em] text-white/95">Comprobante</th>
                <th rowSpan="2" className="border border-rose-700/50 px-4 py-3 align-middle text-center text-[11px] font-black uppercase leading-5 tracking-[0.14em] text-white/95">Concepto</th>
                <th rowSpan="2" className="border border-rose-700/50 px-4 py-3 align-middle text-right text-[11px] font-black uppercase leading-5 tracking-[0.14em] text-white/95 w-36">Importe (S/.)</th>
                <th rowSpan="2" className="border border-rose-700/50 px-4 py-3 align-middle text-center text-[11px] font-black uppercase leading-5 tracking-[0.14em] text-white/95 w-24">Acción</th>
              </tr>
              <tr className="bg-gradient-to-r from-rose-600 to-red-600 text-white">
                <th className="border border-rose-700/50 px-4 py-2 align-middle text-center text-[11px] font-black uppercase leading-5 tracking-[0.14em] text-white/95 w-40">Tipo</th>
                <th className="border border-rose-700/50 px-4 py-2 align-middle text-center text-[11px] font-black uppercase leading-5 tracking-[0.14em] text-white/95 w-28">Serie</th>
                <th className="border border-rose-700/50 px-4 py-2 align-middle text-center text-[11px] font-black uppercase leading-5 tracking-[0.14em] text-white/95 w-32">N°</th>
              </tr>
            </thead>
            <tbody>
              {datosMeses[mesActivo].map((fila, index) => (
                <tr key={fila.id} className="hover:bg-slate-50/80 transition-colors group/row">
                  <td className="border border-slate-300 bg-slate-50 px-2 py-2 text-center font-medium text-slate-500">{index + 1}</td>
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
                        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                        disabled={trimestreCerrado}
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
                      value={fila.serie}
                      onChange={(e) => handleInputChange(mesActivo, fila.id, 'serie', e.target.value)}
                      disabled={trimestreCerrado}
                      className={inputClass}
                      placeholder="Serie"
                    />
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
                      value={fila.importe ?? ''}
                      onFocus={(e) => {
                        if (String(fila.importe) === '0') e.target.select();
                      }}
                      onChange={(e) => handleInputChange(mesActivo, fila.id, 'importe', normalizarImporte(e.target.value))}
                      disabled={trimestreCerrado}
                      className={`${inputClass} text-right font-mono text-base`}
                    />
                  </td>
                  <td className="border border-slate-300 p-1 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => eliminarFila(mesActivo, fila.id)}
                        disabled={trimestreCerrado}
                        className="bg-rose-50 text-rose-600 p-1.5 rounded-lg border border-rose-200 hover:bg-rose-600 hover:text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                        title="Eliminar fila"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-900 text-white font-bold">
                <td colSpan="6" className="border border-slate-700 px-4 py-3 text-right uppercase tracking-wider text-xs">
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
              className="flex items-center gap-2 bg-rose-600 text-white px-6 py-3.5 rounded-2xl hover:bg-rose-700 transition-all shadow-lg font-bold uppercase tracking-wide text-sm disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Plus size={20} /> Agregar Fila
            </button>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-2 bg-white text-red-600 border border-red-200 px-6 py-3.5 rounded-2xl hover:bg-red-50 transition-all shadow-sm font-bold uppercase tracking-wide text-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
            >
              <FileText size={20} /> Descargar PDF
            </button>
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="flex items-center justify-center gap-2 bg-white text-emerald-700 border border-emerald-200 px-6 py-3.5 rounded-2xl hover:bg-emerald-50 transition-all shadow-sm font-bold uppercase tracking-wide text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
            >
              <Download size={20} /> Descargar Excel
            </button>
            <button
              type="button"
              onClick={guardarMesActual}
              disabled={saving || loading || trimestreCerrado}
              className="flex items-center justify-center gap-2 bg-rose-600 text-white px-8 py-3.5 rounded-2xl hover:bg-rose-700 transition-all font-bold shadow-lg disabled:bg-slate-400 uppercase tracking-wide text-sm"
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

export default EgresosView;
