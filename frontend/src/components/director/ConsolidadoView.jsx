import React, { useState, useEffect, useCallback } from 'react';
import { Save, FileText, Download } from 'lucide-react';
import { buildApiUrl } from '../../config/api';
import Toast from '../Toast';
import ConfirmModal from './ConfirmModal';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import ExcelJS from 'exceljs';

const formatearFechaCierre = (fecha) => {
  if (!fecha) return '';

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(fecha));
};

const SALDOS_API_URL = buildApiUrl('/api/movimientos/saldos-banco');
const INGRESOS_API_URL = buildApiUrl('/api/movimientos/ingresos');
const EGRESOS_API_URL = buildApiUrl('/api/movimientos/egresos');
const MANUAL_CONSOLIDADO_API_URL = buildApiUrl('/api/especialista/consolidado/manual');
const MANUAL_Q1_CUTOFF = new Date('2026-06-18T23:59:59-05:00');

const ConsolidadoView = ({
  trimestreId,
  anio,
  directorId,
  schoolName,
  numeroIE,
  trimestreCerrado,
  cerrandoTrimestre,
  mensajeCierre,
  errorCierre,
  cerradoEn,
  onCerrarTrimestre,
}) => {
  const periodos = {
    '1': { label: '1º Trimestre', meses: ['Enero', 'Febrero', 'Marzo'], fin: '31 de Marzo' },
    '2': { label: '2º Trimestre', meses: ['Abril', 'Mayo', 'Junio'], fin: '30 de Junio' },
    '3': { label: '3º Trimestre', meses: ['Julio', 'Agosto', 'Septiembre'], fin: '30 de Septiembre' },
    '4': { label: '4º Trimestre', meses: ['Octubre', 'Noviembre', 'Diciembre'], fin: '31 de Diciembre' },
  };

  const actual = periodos[trimestreId];
  const saldoCajaLabel = 'SALDO DE CAJA AL TÉRMINO DEL TRIMESTRE';
  const saldoDineroLabel = `SALDO AL ${actual.fin}, ${anio}`.toUpperCase();

  // Variables de estado para los inputs de la Seccion 2
  const [saldosBanco, setSaldosBanco] = useState({
    mes0: '',
    mes1: '',
    mes2: '',
  });
  const [savingSaldos, setSavingSaldos] = useState(false);
  const [savingManualConsolidado, setSavingManualConsolidado] = useState(false);
  const [mensajeSaldos, setMensajeSaldos] = useState('');
  const [errorSaldos, setErrorSaldos] = useState('');
  const [saldoInicialCaja, setSaldoInicialCaja] = useState(0);
  const [movimientos, setMovimientos] = useState({
    ingresos: [0, 0, 0],
    egresos: [0, 0, 0]
  });
  const [savingTrimestreCero, setSavingTrimestreCero] = useState(false);
  const [confirmAction, setConfirmAction] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    isDestructive: false,
    onConfirm: null,
  });

  const handleSaldoChange = (campo, valor) => {
    setSaldosBanco((prev) => ({ ...prev, [campo]: valor }));
  };

  const cargaManualConsolidadoHabilitada = Number(trimestreId) === 1
    && Number(anio) === 2026
    && new Date() <= MANUAL_Q1_CUTOFF;

  const handleMovimientoManualChange = (tipo, index, valor) => {
    setMovimientos((prev) => {
      const nextValues = [...prev[tipo]];
      nextValues[index] = valor === '' ? 0 : Number(valor);
      return { ...prev, [tipo]: nextValues };
    });
  };

  const handleSaldoInicialCajaManualChange = (valor) => {
    setSaldoInicialCaja(valor === '' ? 0 : Number(valor));
  };

  // Calculos automaticos
  const totalIngresosMeses = movimientos.ingresos.reduce((sum, val) => sum + val, 0);
  const totalIngresos = saldoInicialCaja + totalIngresosMeses;
  const totalEgresos = movimientos.egresos.reduce((sum, val) => sum + val, 0);

  const dineroEnCaja = totalIngresos - totalEgresos;
  const dineroEnBanco = parseFloat(saldosBanco.mes2 || 0);
  const saldoDineroTotal = dineroEnCaja + dineroEnBanco;

  const formatCurrency = (val) => new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

  const obtenerRangoTrimestre = useCallback((quarterId) => {
    const currentYear = Number(anio);
    const startMonth = (Number(quarterId) - 1) * 3;
    const startDate = new Date(currentYear, startMonth, 1);
    const endDate = new Date(currentYear, startMonth + 3, 0);
    const formatear = (date) => date.toISOString().split('T')[0];
    return { startDate: formatear(startDate), endDate: formatear(endDate), startMonth };
  }, [anio]);

  const obtenerRangoTrimestrePorAnio = useCallback((quarterId, targetYear) => {
    const currentYear = Number(targetYear);
    const startMonth = (Number(quarterId) - 1) * 3;
    const startDate = new Date(currentYear, startMonth, 1);
    const endDate = new Date(currentYear, startMonth + 3, 0);
    const formatear = (date) => date.toISOString().split('T')[0];
    return { startDate: formatear(startDate), endDate: formatear(endDate) };
  }, []);

  const obtenerPeriodoAnterior = useCallback((quarterId = trimestreId, targetYear = anio) => {
    const trimestreActual = Number(quarterId);
    const anioActual = Number(targetYear);

    if (trimestreActual === 1) {
      return { trimestreId: 4, anio: anioActual - 1 };
    }

    return { trimestreId: trimestreActual - 1, anio: anioActual };
  }, [anio, trimestreId]);

  // Cargar ingresos y egresos para la Seccion 1 y 3
  useEffect(() => {
    const cargarMovimientos = async () => {
      if (!directorId || !trimestreId) return;
      try {
        const { startDate, endDate, startMonth } = obtenerRangoTrimestre(trimestreId);
        const query = new URLSearchParams({ directorId: String(directorId), startDate, endDate });
        const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

        const [resIngresos, resEgresos] = await Promise.all([
          fetch(`${buildApiUrl('/api/movimientos/ingresos')}?${query.toString()}`, { headers }),
          fetch(`${buildApiUrl('/api/movimientos/egresos')}?${query.toString()}`, { headers })
        ]);

        const sumMeses = (data) => {
          const totales = [0, 0, 0];
          if (data.success && Array.isArray(data.data)) {
            data.data.forEach(item => {
              if (item.fecha) {
                const [, month] = item.fecha.split('T')[0].split('-');
                const offset = (parseInt(month, 10) - 1) - startMonth;
                if (offset >= 0 && offset < 3) totales[offset] += Number(item.monto || 0);
              }
            });
          }
          return totales;
        };

        setMovimientos({ ingresos: sumMeses(await resIngresos.json()), egresos: sumMeses(await resEgresos.json()) });
      } catch (err) {
        console.error('Error cargando movimientos de caja', err);
      }
    };
    cargarMovimientos();
  }, [directorId, trimestreId, obtenerRangoTrimestre]);

  useEffect(() => {
    const cargarSaldoInicialCaja = async () => {
      if (!directorId || !trimestreId) return;

      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const obtenerSaldoInicialManualCaja = async (quarterId, targetYear) => {
        if (Number(quarterId) !== 1 || Number(targetYear) !== 2026) {
          return 0;
        }

        const query = new URLSearchParams({
          directorId: String(directorId),
          trimestreId: String(quarterId),
          anio: String(targetYear)
        });
        const res = await fetch(`${SALDOS_API_URL}?${query.toString()}`, { headers });
        const data = await res.json();

        return res.ok && data.success && data.data
          ? Number(data.data.saldo_inicial || 0)
          : 0;
      };

      const calcularSaldoFinalTrimestre = async (quarterId, targetYear) => {
        if (Number(targetYear) < 2026) {
          return 0;
        }

        const periodoAnterior = obtenerPeriodoAnterior(quarterId, targetYear);
        const saldoInicialAnterior = await calcularSaldoFinalTrimestre(periodoAnterior.trimestreId, periodoAnterior.anio);
        const { startDate, endDate } = obtenerRangoTrimestrePorAnio(quarterId, targetYear);
        const query = new URLSearchParams({
          directorId: String(directorId),
          startDate,
          endDate
        });

        const [resIngresos, resEgresos] = await Promise.all([
          fetch(`${buildApiUrl('/api/movimientos/ingresos')}?${query.toString()}`, { headers }),
          fetch(`${buildApiUrl('/api/movimientos/egresos')}?${query.toString()}`, { headers })
        ]);

        const dataIngresos = await resIngresos.json();
        const dataEgresos = await resEgresos.json();

        const totalIngresos = dataIngresos.success && Array.isArray(dataIngresos.data)
          ? dataIngresos.data.reduce((sum, item) => sum + Number(item.monto || 0), 0)
          : 0;

        const totalEgresos = dataEgresos.success && Array.isArray(dataEgresos.data)
          ? dataEgresos.data.reduce((sum, item) => sum + Number(item.monto || 0), 0)
          : 0;

        const saldoInicialManual = await obtenerSaldoInicialManualCaja(quarterId, targetYear);

        return saldoInicialAnterior + saldoInicialManual + totalIngresos - totalEgresos;
      };

      try {
        const periodoAnterior = obtenerPeriodoAnterior();

        if (cargaManualConsolidadoHabilitada) {
          const saldoInicialManual = await obtenerSaldoInicialManualCaja(trimestreId, anio);
          setSaldoInicialCaja(saldoInicialManual);
          return;
        }

        if (periodoAnterior.anio < 2026) {
          setSaldoInicialCaja(0);
          return;
        }

        const saldoFinalAnterior = await calcularSaldoFinalTrimestre(periodoAnterior.trimestreId, periodoAnterior.anio);
        setSaldoInicialCaja(saldoFinalAnterior);
      } catch (err) {
        console.error('Error cargando saldo inicial del trimestre anterior', err);
        setSaldoInicialCaja(0);
      }
    };

    cargarSaldoInicialCaja();
  }, [directorId, trimestreId, anio, obtenerPeriodoAnterior, obtenerRangoTrimestrePorAnio, cargaManualConsolidadoHabilitada]);

  // Cargar los saldos de la base de datos al abrir o cambiar trimestre
  useEffect(() => {
    const cargarSaldos = async () => {
      if (!directorId || !trimestreId) return;

      try {
        const query = new URLSearchParams({
          directorId: String(directorId),
          trimestreId: String(trimestreId),
          anio: String(anio)
        });

        const res = await fetch(`${SALDOS_API_URL}?${query.toString()}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();

        if (res.ok && data.success && data.data) {
          setSaldosBanco({
            mes0: data.data.saldo_mes1 || '',
            mes1: data.data.saldo_mes2 || '',
            mes2: data.data.saldo_mes3 || '',
          });
        } else {
          setSaldosBanco({ mes0: '', mes1: '', mes2: '' });
        }
      } catch (err) {
        console.error('Error cargando saldos del banco', err);
      }
    };

    cargarSaldos();
  }, [directorId, trimestreId, anio]);

  // Guardar los saldos en la base de datos
  const guardarSaldos = async () => {
    if (!directorId || trimestreCerrado) return;

    setSavingSaldos(true);
    setMensajeSaldos('');
    setErrorSaldos('');

    try {
      const res = await fetch(SALDOS_API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          directorId,
          trimestreId,
          anio: Number(anio),
          // Convertimos al formato que probablemente espera tu base de datos
          saldos: {
            saldo_inicial: 0,
            saldo_mes1: saldosBanco.mes0 || 0,
            saldo_mes2: saldosBanco.mes1 || 0,
            saldo_mes3: saldosBanco.mes2 || 0
          }
        })
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.success) {
          setMensajeSaldos('Saldos de Cuenta Corriente guardados con exito.');
          setTimeout(() => setMensajeSaldos(''), 3000);
        } else {
          throw new Error(data.message || 'Error del servidor al guardar los saldos.');
        }
      } else {
        if (res.status === 404) {
          throw new Error('Error 404: La ruta de saldos-banco no existe en el backend.');
        }
        throw new Error(`Error del servidor (Codigo ${res.status}). Revisa la consola de tu backend.`);
      }
    } catch (err) {
      console.error('Error guardando saldos', err);
      setErrorSaldos(err.message);
    } finally {
      setSavingSaldos(false);
    }
  };

  const guardarConsolidadoManual = async () => {
    if (!directorId || !cargaManualConsolidadoHabilitada) return;

    setSavingManualConsolidado(true);
    setMensajeSaldos('');
    setErrorSaldos('');

    try {
      const res = await fetch(MANUAL_CONSOLIDADO_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          directorId,
          trimestre: Number(trimestreId),
          anio: Number(anio),
          saldoInicialCaja,
          ingresosMensuales: movimientos.ingresos,
          egresosMensuales: movimientos.egresos,
          saldosBancoMensuales: [
            saldosBanco.mes0 || 0,
            saldosBanco.mes1 || 0,
            saldosBanco.mes2 || 0
          ],
          observacion: 'Extensión excepcional Q1 hasta 18/06/2026: carga directa desde consolidado'
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'No se pudo guardar la carga manual del consolidado.');
      }

      setMensajeSaldos('Consolidado manual guardado y registrado en auditoria.');
      setTimeout(() => setMensajeSaldos(''), 3500);
    } catch (err) {
      console.error('Error guardando consolidado manual', err);
      setErrorSaldos(err.message);
    } finally {
      setSavingManualConsolidado(false);
    }
  };

  const declararTrimestreEnCero = () => {
    if (!directorId || trimestreCerrado || savingTrimestreCero) return;

    setConfirmAction({
      isOpen: true,
      title: 'Declarar Trimestre en Cero',
      message: `Esta acción dejará en S/. 0.00 los ingresos, egresos y saldos de cuenta corriente del ${actual.label}. Úsala solo si la institución reporta el trimestre sin movimientos.`,
      confirmText: 'Sí, declarar en cero',
      isDestructive: true,
      onConfirm: async () => {
        setSavingTrimestreCero(true);
        setMensajeSaldos('');
        setErrorSaldos('');

        try {
          const { startDate, endDate } = obtenerRangoTrimestre(trimestreId);
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          };
          const limpiarMovimientos = async (apiUrl) => {
            const response = await fetch(`${apiUrl}/replace-range`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                directorId,
                startDate,
                endDate,
                registros: [],
              }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
              throw new Error(data.message || 'No se pudo declarar el trimestre en cero.');
            }
          };

          await Promise.all([
            limpiarMovimientos(INGRESOS_API_URL),
            limpiarMovimientos(EGRESOS_API_URL),
            fetch(SALDOS_API_URL, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                directorId,
                trimestreId,
                anio: Number(anio),
                saldos: {
                  saldo_inicial: 0,
                  saldo_mes1: 0,
                  saldo_mes2: 0,
                  saldo_mes3: 0
                }
              })
            }).then(async (response) => {
              const data = await response.json();
              if (!response.ok || !data.success) {
                throw new Error(data.message || 'No se pudieron guardar los saldos en cero.');
              }
            })
          ]);

          [0, 1, 2].forEach((monthIndex) => {
            localStorage.removeItem(`draft_ingresos_${directorId}_${trimestreId}_${monthIndex}`);
            localStorage.removeItem(`draft_egresos_${directorId}_${trimestreId}_${monthIndex}`);
          });

          setMovimientos({ ingresos: [0, 0, 0], egresos: [0, 0, 0] });
          setSaldosBanco({ mes0: 0, mes1: 0, mes2: 0 });
          if (cargaManualConsolidadoHabilitada) {
            setSaldoInicialCaja(0);
          }
          setMensajeSaldos('Trimestre declarado en cero. Revisa el consolidado y cierra el trimestre para enviarlo.');
          setTimeout(() => setMensajeSaldos(''), 4500);
        } catch (err) {
          console.error('Error declarando trimestre en cero', err);
          setErrorSaldos(err.message || 'No se pudo declarar el trimestre en cero.');
        } finally {
          setSavingTrimestreCero(false);
        }
      }
    });
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageMargin = 14;
    const tableWidth = doc.internal.pageSize.getWidth() - (pageMargin * 2);
    const amountColumnWidth = 28;
    const labelColumnWidth = tableWidth - amountColumnWidth;
    const commonTableOptions = {
      theme: 'grid',
      margin: { left: pageMargin, right: pageMargin },
      tableWidth,
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 2,
        lineColor: [203, 213, 225],
        lineWidth: 0.2,
        textColor: [30, 41, 59],
        valign: 'middle'
      },
      headStyles: {
        fillColor: [2, 132, 199],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: labelColumnWidth },
        1: { cellWidth: amountColumnWidth, halign: 'right' }
      }
    };
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
        doc.text('NO OFICIAL', pageWidth / 2, stampY + 29, { align: 'center' });
      }
    };

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORME ECONÓMICO TRIMESTRAL', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.line(pageMargin, 20, pageMargin + tableWidth, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Recursos Propios de la Institución Educativa', doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });

    autoTable(doc, {
      startY: 31,
      theme: 'grid',
      margin: { left: pageMargin, right: pageMargin },
      tableWidth,
      body: [
        [
          { content: 'Trimestre:', styles: { fillColor: [226, 232, 240], fontStyle: 'bold', halign: 'left' } },
          { content: actual.meses.join(', ').toUpperCase(), styles: { fontStyle: 'bold', halign: 'center' } },
          { content: String(anio), styles: { fontStyle: 'bold', halign: 'center' } }
        ],
        [
          { content: 'Número de la II.EE.', styles: { fillColor: [226, 232, 240], fontStyle: 'bold', halign: 'left' } },
          { content: numeroIE || '-', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } }
        ],
        [
          { content: 'Nombre de la II.EE.', styles: { fillColor: [226, 232, 240], fontStyle: 'bold', halign: 'left' } },
          { content: schoolName || 'No disponible', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center', textColor: [3, 105, 161] } }
        ]
      ],
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3.2,
        lineColor: [203, 213, 225],
        lineWidth: 0.25,
        textColor: [15, 23, 42],
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 48 },
        1: { cellWidth: tableWidth - 78 },
        2: { cellWidth: 30 }
      }
    });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);

    const tabla1Body = [
      [{ content: 'INGRESOS', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [15, 23, 42] } }],
      ['+ Saldo inicial del trimestre', `S/. ${formatCurrency(saldoInicialCaja)}`],
      ...actual.meses.map((mes, index) => [`+ Correspondiente a ${mes}`, `S/. ${formatCurrency(movimientos.ingresos[index])}`]),
      [{ content: `Total Ingresos del ${actual.label}`, styles: { fontStyle: 'bold', halign: 'right' } }, { content: `S/. ${formatCurrency(totalIngresos)}`, styles: { fontStyle: 'bold', halign: 'right' } }],
      [{ content: 'EGRESOS', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [15, 23, 42] } }],
      ...actual.meses.map((mes, index) => [`- Correspondiente a ${mes}`, `S/. ${formatCurrency(movimientos.egresos[index])}`]),
      [{ content: `Total Egresos del ${actual.label}`, styles: { fontStyle: 'bold', halign: 'right' } }, { content: `S/. ${formatCurrency(totalEgresos)}`, styles: { fontStyle: 'bold', halign: 'right' } }],
      [{ content: saldoCajaLabel, styles: { fillColor: [15, 23, 42], lineColor: [15, 23, 42], fontStyle: 'bold', textColor: [255, 255, 255], halign: 'right' } }, { content: `S/. ${formatCurrency(dineroEnCaja)}`, styles: { fillColor: [15, 23, 42], lineColor: [15, 23, 42], fontStyle: 'bold', textColor: [255, 255, 255], halign: 'right' } }]
    ];

    autoTable(doc, {
      ...commonTableOptions,
      startY: doc.lastAutoTable.finalY + 8,
      head: [[{ content: '1. DETALLE DE LOS MOVIMIENTOS DE CAJA', colSpan: 2, styles: { halign: 'left', fillColor: [2, 132, 199] } }]],
      body: tabla1Body
    });

    const tabla2Body = actual.meses.map((mes, index) => [
      `Saldo al terminar ${mes}`,
      `S/. ${formatCurrency(saldosBanco[`mes${index}`] || 0)}`
    ]);

    autoTable(doc, {
      ...commonTableOptions,
      startY: doc.lastAutoTable.finalY + 6,
      head: [[{ content: '2. DETALLE DE LOS MOVIMIENTOS DE LA CUENTA CORRIENTE', colSpan: 2, styles: { halign: 'left', fillColor: [2, 132, 199] } }]],
      body: tabla2Body
    });

    const tabla3Body = [
      ['Dinero en Caja', `S/. ${formatCurrency(dineroEnCaja)}`],
      ['Dinero en Cuenta Corriente del Banco de la Nación', `S/. ${formatCurrency(dineroEnBanco)}`],
      [{ content: saldoDineroLabel, styles: { fillColor: [15, 23, 42], lineColor: [15, 23, 42], fontStyle: 'bold', textColor: [255, 255, 255], halign: 'right' } }, { content: `S/. ${formatCurrency(saldoDineroTotal)}`, styles: { fillColor: [15, 23, 42], lineColor: [15, 23, 42], fontStyle: 'bold', textColor: [255, 255, 255], halign: 'right' } }]
    ];

    autoTable(doc, {
      ...commonTableOptions,
      startY: doc.lastAutoTable.finalY + 6,
      head: [[{ content: '3. CONSOLIDADO', colSpan: 2, styles: { halign: 'left', fillColor: [2, 132, 199] } }]],
      body: tabla3Body
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    let signatureY = doc.lastAutoTable.finalY + 24;
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
    doc.save(`Consolidado_${actual.label.replace(/ /g, '_')}_${nombreSeguro}.pdf`);
  };

  const handleDownloadExcel = async () => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sistema de Gestion de Recursos Propios - UGEL';
    wb.created = new Date();
    wb.modified = new Date();

    const ws = wb.addWorksheet('Consolidado', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 5, showGridLines: false }]
    });
    ws.properties.defaultRowHeight = 22;
    ws.pageSetup = {
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: { left: 0.35, right: 0.35, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2 }
    };

    ws.columns = [
      { key: 'concepto', width: 58 },
      { key: 'importe', width: 22 }
    ];

    ws.mergeCells('A1:B1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'INFORME ECONÓMICO TRIMESTRAL';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } }; // sky-600
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    ws.mergeCells('A2:B2');
    ws.getCell('A2').value = 'Recursos Propios de la Institución Educativa';
    ws.getCell('A2').font = { bold: true, color: { argb: 'FF0F172A' } };
    ws.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

    ws.mergeCells('A3:B3');
    ws.getCell('A3').value = `Periodo: ${actual.meses.join(', ').toUpperCase()} ${anio}`;
    ws.getCell('A3').font = { bold: true, color: { argb: 'FF334155' } };
    ws.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

    ws.mergeCells('A4:B4');
    ws.getCell('A4').value = `N° IE: ${numeroIE || '-'}    |    Institución Educativa: ${schoolName || 'No disponible'}`;
    ws.getCell('A4').font = { bold: true, color: { argb: 'FF0369A1' } };
    ws.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    ws.addRow([]); // Fila 4 de separación

    const addSectionHeader = (title) => {
      const row = ws.addRow([title]);
      ws.mergeCells(`A${row.number}:B${row.number}`);
      row.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } }; // sky-600
      row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
      row.height = 24;
    };

    const addSubHeader = (title) => {
      const row = ws.addRow([title]);
      ws.mergeCells(`A${row.number}:B${row.number}`);
      row.getCell(1).font = { bold: true };
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      row.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
    };

    const addTotalRow = (label, amount, color) => {
      const row = ws.addRow([label, Number(amount)]);
      row.font = { bold: true, color: { argb: color } };
      row.getCell(1).alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
      row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
      return row;
    };

    const applyFinalRowStyle = (row) => {
      row.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      row.height = 24;
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
      });
    };

    addSectionHeader('1. DETALLE DE LOS MOVIMIENTOS DE CAJA');
    addSubHeader('INGRESOS');
    ws.addRow(['+ Saldo inicial del trimestre', Number(saldoInicialCaja)]);
    actual.meses.forEach((mes, index) => ws.addRow([`+ Correspondiente a ${mes}`, Number(movimientos.ingresos[index])]));
    addTotalRow(`Total Ingresos del ${actual.label}`, totalIngresos, 'FF065F46');
    
    addSubHeader('EGRESOS');
    actual.meses.forEach((mes, index) => ws.addRow([`- Correspondiente a ${mes}`, Number(movimientos.egresos[index])]));
    addTotalRow(`Total Egresos del ${actual.label}`, totalEgresos, 'FF9F1239');
    const rowSaldoCaja = ws.addRow([saldoCajaLabel, Number(dineroEnCaja)]);
    applyFinalRowStyle(rowSaldoCaja);
    
    ws.addRow([]);
    addSectionHeader('2. DETALLE DE LOS MOVIMIENTOS DE LA CUENTA CORRIENTE');
    actual.meses.forEach((mes, index) => ws.addRow([`Saldo al terminar ${mes}`, Number(saldosBanco[`mes${index}`] || 0)]));
    
    ws.addRow([]);
    addSectionHeader('3. CONSOLIDADO');
    ws.addRow(['Dinero en Caja', Number(dineroEnCaja)]);
    ws.addRow(['Dinero en Cuenta Corriente del Banco de la Nación', Number(dineroEnBanco)]);
    const rowTotal = ws.addRow([saldoDineroLabel, Number(saldoDineroTotal)]);
    applyFinalRowStyle(rowTotal);

    const signatureRowNumber = rowTotal.number + 4;
    ws.getCell(`A${signatureRowNumber}`).border = { bottom: { style: 'thin', color: { argb: 'FF0F172A' } } };
    ws.getCell(`B${signatureRowNumber}`).border = { bottom: { style: 'thin', color: { argb: 'FF0F172A' } } };
    ws.getCell(`A${signatureRowNumber + 1}`).value = 'Director';
    ws.getCell(`B${signatureRowNumber + 1}`).value = 'Tesorero';
    ['A', 'B'].forEach((column) => {
      ws.getCell(`${column}${signatureRowNumber + 1}`).font = { bold: true, color: { argb: 'FF0F172A' } };
      ws.getCell(`${column}${signatureRowNumber + 1}`).alignment = { horizontal: 'center' };
    });

    if (!trimestreCerrado) {
      ws.mergeCells('A5:B5');
      const watermarkCell = ws.getCell('A5');
      watermarkCell.value = 'NO OFICIAL';
      watermarkCell.font = { bold: true, size: 18, color: { argb: 'FFBE123C' } };
      watermarkCell.alignment = { horizontal: 'center', vertical: 'middle' };
      watermarkCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } };
      ws.getRow(5).height = 28;
    }

    // Dar formato moneda y bordes a toda la tabla
    ws.eachRow((row, rowNumber) => {
      const cell = row.getCell(2);
      if (typeof cell.value === 'number') cell.numFmt = '"S/." #,##0.00';
      if (rowNumber > 5 && row.getCell(1).value) {
        row.eachCell((c, columnNumber) => {
          c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          c.alignment = {
            horizontal: c.alignment?.horizontal || (columnNumber === 2 ? 'right' : 'left'),
            vertical: 'middle',
            wrapText: true
          };
        });
      }
    });
    ws.pageSetup.printArea = `A1:B${ws.lastRow.number}`;

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const nombreSeguro = (schoolName || 'IE').replace(/["<>|:*?\\/]/g, '').trim().replace(/\s+/g, '_');
    link.download = `Consolidado_${actual.label.replace(/ /g, '_')}_${nombreSeguro}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const tdLabelClass = 'border-b border-slate-200 px-5 py-3.5 text-sm text-slate-700';
  const tdValueClass = 'border-b border-slate-200 px-5 py-3.5 text-sm text-right font-mono font-semibold text-slate-900';
  const sectionHeaderClass = 'bg-sky-700 text-white px-5 py-3 font-bold text-sm uppercase tracking-[0.16em] text-left';
  const finalRowClass = 'bg-[#12314a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]';
  const totalLabelClass = 'border-b px-5 py-3.5 text-right text-xs font-extrabold uppercase tracking-wide';
  const finalLabelClass = 'px-5 py-3.5 text-right text-xs font-extrabold uppercase tracking-wide text-white';
  const finalValueClass = 'px-5 py-3.5 text-right font-mono text-sm font-extrabold text-white';

  const saldosEditables = !trimestreCerrado || cargaManualConsolidadoHabilitada;
  const movimientosManualesEditables = cargaManualConsolidadoHabilitada;

  const trEditableClass = saldosEditables
    ? 'bg-amber-50/30 hover:bg-amber-100/40 transition-colors'
    : 'hover:bg-slate-50/80 transition-colors';

  const tdInputContainerClass = saldosEditables
    ? 'border-b border-slate-200 p-0 text-sm text-right font-mono text-slate-900 focus-within:ring-2 focus-within:ring-inset focus-within:ring-amber-500'
    : 'border-b border-slate-200 p-0 text-sm text-right font-mono text-slate-900 focus-within:ring-2 focus-within:ring-inset focus-within:ring-sky-500';

  const movimientoInputClass = movimientosManualesEditables
    ? 'border-b border-slate-200 p-0 text-sm text-right font-mono text-slate-900 focus-within:ring-2 focus-within:ring-inset focus-within:ring-amber-500 bg-amber-50/30'
    : tdValueClass;

  const renderMoneyInput = ({ value, onChange, disabled }) => (
    <input
      type="number"
      min="0"
      step="0.01"
      onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
      value={value}
      onChange={(e) => {
        if (e.target.value === '' || Number(e.target.value) >= 0) {
          onChange(e.target.value);
        }
      }}
      disabled={disabled}
      className="w-full h-full px-4 py-3 bg-transparent text-right outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
      placeholder="0.00"
    />
  );

  const estadoEdicionConsolidadoClass = cargaManualConsolidadoHabilitada
    ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300';

  const consolidadoTieneMontos = [
    saldoInicialCaja,
    ...movimientos.ingresos,
    ...movimientos.egresos,
    saldosBanco.mes0,
    saldosBanco.mes1,
    saldosBanco.mes2
  ].some((value) => Number(value || 0) > 0);

  const trimestreCeroBloqueado = savingTrimestreCero || cerrandoTrimestre || consolidadoTieneMontos;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="bg-white/95 p-7 rounded-[28px] shadow-[0_24px_60px_-34px_rgba(15,23,42,0.55)] border border-slate-200/90 dark:border-slate-700 dark:bg-slate-800/95">
        <div className="mb-6 rounded-3xl border border-slate-300 bg-slate-50/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/45">
          <div className="grid grid-cols-12 gap-2 text-sm">
            <div className="col-span-3 rounded-2xl font-bold bg-slate-200 p-3 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Trimestre:</div>
            <div className="col-span-7 rounded-2xl p-3 border border-slate-300 bg-white text-center font-bold uppercase shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              {actual.meses.join(', ')}
            </div>
            <div className="col-span-2 rounded-2xl p-3 border border-slate-300 bg-white text-center font-bold shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">{anio}</div>

            <div className="col-span-3 rounded-2xl font-bold bg-slate-200 p-3 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Número de la II.EE.</div>
            <div className="col-span-9 rounded-2xl p-3 border border-slate-300 bg-white text-center font-bold shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">{numeroIE || '-'}</div>

            <div className="col-span-3 rounded-2xl font-bold bg-slate-200 p-3 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Nombre de la II.EE.</div>
            <div className="col-span-9 rounded-2xl p-3 border border-slate-300 bg-white text-center font-bold uppercase text-sky-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-sky-200">{schoolName || 'I.E. Sideral Carrion'}</div>
          </div>
        </div>

        {(mensajeCierre || errorCierre || trimestreCerrado) && (
          <div
            className={`mb-6 rounded-2xl border px-5 py-4 text-sm shadow-sm ${
              errorCierre
                ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
            }`}
          >
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-bold">
                  {errorCierre ? 'No se pudo consultar el estado del trimestre' : 'Trimestre cerrado'}
                </p>
                <p className="mt-1 leading-relaxed">
                  {errorCierre || mensajeCierre || `Este periodo fue cerrado${cerradoEn ? ` el ${formatearFechaCierre(cerradoEn)}` : ''}.`}
                </p>
              </div>
              {!errorCierre && (
                <span className="mt-2 w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700 md:mt-0">
                  Solo consulta
                </span>
              )}
            </div>
          </div>
        )}

        {cargaManualConsolidadoHabilitada && (
          <div className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-sm ${estadoEdicionConsolidadoClass}`}>
            Carga manual excepcional habilitada para el 1er trimestre 2026 hasta el 18/06/2026. Los cambios se guardan directamente en el consolidado y quedan registrados en auditoria.
          </div>
        )}

        <div className="overflow-hidden rounded-[22px] border border-slate-200 shadow-sm dark:border-slate-600 dark:shadow-[0_18px_50px_-28px_rgba(0,0,0,0.9)]">
          <table className="w-full border-collapse bg-white">
            <colgroup>
              <col className="w-[86%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr>
                <th colSpan="2" className={sectionHeaderClass}>1. DETALLE DE LOS MOVIMIENTOS DE CAJA</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan="2" className="border-b border-sky-100 bg-sky-50/70 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide text-sky-800">INGRESOS</td></tr>
              <tr>
                <td className={tdLabelClass}>+ Saldo inicial del trimestre</td>
                <td className={movimientoInputClass}>
                  {movimientosManualesEditables
                    ? renderMoneyInput({
                        value: saldoInicialCaja,
                        onChange: handleSaldoInicialCajaManualChange,
                        disabled: savingManualConsolidado
                      })
                    : formatCurrency(saldoInicialCaja)}
                </td>
              </tr>
              {actual.meses.map((mes, index) => (
                <tr key={mes} className="hover:bg-sky-50/80 transition-colors">
                  <td className={tdLabelClass}>+ Correspondiente a {mes}</td>
                  <td className={movimientoInputClass}>
                    {movimientosManualesEditables
                      ? renderMoneyInput({
                          value: movimientos.ingresos[index],
                          onChange: (value) => handleMovimientoManualChange('ingresos', index, value),
                          disabled: savingManualConsolidado
                        })
                      : formatCurrency(movimientos.ingresos[index])}
                  </td>
                </tr>
              ))}
              <tr className="bg-sky-50/40 font-bold">
                <td className={`${totalLabelClass} border-sky-100 text-sky-900`}>Total Ingresos del {actual.label}</td>
                <td className={tdValueClass}>{formatCurrency(totalIngresos)}</td>
              </tr>

              <tr><td colSpan="2" className="border-b border-rose-100 bg-rose-50/70 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide text-rose-800">EGRESOS</td></tr>
              {actual.meses.map((mes, index) => (
                <tr key={mes} className="hover:bg-rose-50/80 transition-colors">
                  <td className={tdLabelClass}>- Correspondiente a {mes}</td>
                  <td className={movimientoInputClass}>
                    {movimientosManualesEditables
                      ? renderMoneyInput({
                          value: movimientos.egresos[index],
                          onChange: (value) => handleMovimientoManualChange('egresos', index, value),
                          disabled: savingManualConsolidado
                        })
                      : formatCurrency(movimientos.egresos[index])}
                  </td>
                </tr>
              ))}
              <tr className="bg-rose-50/45 font-bold">
                <td className={`${totalLabelClass} border-rose-100 text-rose-900`}>Total Egresos del {actual.label}</td>
                <td className={tdValueClass}>{formatCurrency(totalEgresos)}</td>
              </tr>

              <tr className={finalRowClass}>
                <td className={finalLabelClass}>{saldoCajaLabel}</td>
                <td className={finalValueClass}>{formatCurrency(dineroEnCaja)}</td>
              </tr>

              <tr><td colSpan="2" className={sectionHeaderClass}>2. DETALLE DE LOS MOVIMIENTOS DE LA CUENTA CORRIENTE</td></tr>
              <tr>
                <td colSpan="2" className="border-b border-slate-200 p-0">
                  <div className="flex justify-between items-center text-[11px] px-5 py-2.5 bg-slate-50 text-slate-600">
                    <span>Segun el Estado de Cuenta mensual emitido por el Banco de la Nación:</span>
                    {saldosEditables && (
                      <span className="flex items-center gap-1.5 font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-md border border-amber-200">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Completar manualmente
                      </span>
                    )}
                  </div>
                </td>
              </tr>

              {actual.meses.map((mes, index) => (
                <tr key={`cc-${mes}`} className={trEditableClass}>
                  <td className={tdLabelClass}>Saldo al terminar {mes}</td>
                  <td className={tdInputContainerClass}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                      value={saldosBanco[`mes${index}`]}
                      onChange={(e) => {
                        if (Number(e.target.value) >= 0) {
                          handleSaldoChange(`mes${index}`, e.target.value);
                        }
                      }}
                      disabled={!saldosEditables || savingManualConsolidado}
                      className="w-full h-full px-4 py-3 bg-transparent text-right outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
                      placeholder="0.00"
                    />
                  </td>
                </tr>
              ))}

              <tr>
                <td colSpan="2" className="border-b border-slate-200 bg-white px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Toast message={mensajeSaldos} type="success" onClose={() => setMensajeSaldos('')} />
                    <Toast message={errorSaldos} type="error" onClose={() => setErrorSaldos('')} />
                    <button
                      type="button"
                      onClick={guardarSaldos}
                      disabled={trimestreCerrado || savingSaldos || savingManualConsolidado}
                      className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-extrabold text-sky-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/20 dark:disabled:border-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                    >
                      <Save size={17} /> {savingSaldos ? 'Guardando...' : 'Guardar saldos'}
                    </button>
                    {cargaManualConsolidadoHabilitada && (
                      <button
                        type="button"
                        onClick={guardarConsolidadoManual}
                        disabled={savingManualConsolidado || savingSaldos}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-amber-600 hover:shadow-md disabled:translate-y-0 disabled:cursor-wait disabled:border-slate-200 disabled:bg-slate-300 disabled:text-white disabled:shadow-none"
                      >
                        <Save size={17} /> {savingManualConsolidado ? 'Guardando...' : 'Guardar consolidado manual'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>

              <tr><td colSpan="2" className={sectionHeaderClass}>3. CONSOLIDADO</td></tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="border-b border-slate-200 px-5 py-3.5 text-sm text-slate-700">Dinero en Caja</td>
                <td className="border-b border-slate-200 bg-emerald-50/30 px-5 py-3.5 text-right font-mono text-sm font-semibold text-slate-900">
                  {formatCurrency(dineroEnCaja)}
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="border-b border-slate-200 px-5 py-3.5 text-sm text-slate-700">Dinero en Cuenta Corriente del Banco de la Nación *</td>
                <td className="border-b border-slate-200 bg-sky-50/30 px-5 py-3.5 text-right font-mono text-sm font-semibold text-slate-900">
                  {formatCurrency(dineroEnBanco)}
                </td>
              </tr>
              <tr className={finalRowClass}>
                <td className={finalLabelClass}>{saldoDineroLabel}</td>
                <td className={finalValueClass}>
                  {formatCurrency(saldoDineroTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 space-y-4">
          {trimestreCerrado ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
              Este trimestre ya no admite modificaciones. Puedes descargar el consolidado en PDF o Excel.
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={onCerrarTrimestre}
                disabled={cerrandoTrimestre || savingTrimestreCero}
                className="w-full rounded-2xl bg-red-700 py-4 text-lg font-bold uppercase tracking-wide text-white shadow-lg transition-all hover:bg-red-800 disabled:cursor-wait disabled:bg-slate-400"
              >
                {cerrandoTrimestre ? 'Cerrando...' : 'Cerrar Trimestre'}
              </button>

              <button
                type="button"
                onClick={declararTrimestreEnCero}
                disabled={trimestreCeroBloqueado}
                title={consolidadoTieneMontos ? 'No disponible porque ya existen montos registrados.' : 'Declarar todo el trimestre en cero'}
                className="mx-auto inline-flex w-full max-w-md items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-sky-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/20"
              >
                <span className="rounded-lg bg-white px-2 py-0.5 font-mono text-[12px] shadow-sm dark:bg-slate-800">
                  S/. 0
                </span>
                {savingTrimestreCero ? 'Declarando' : 'En cero'}
              </button>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-slate-200 mt-6 dark:border-slate-700">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-red-600 text-red-600 bg-white py-3.5 text-sm font-bold uppercase tracking-wide hover:bg-red-50 hover:shadow-md transition-all dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
            >
              <FileText size={20} /> Descargar Consolidado (PDF)
            </button>

            <button
              type="button"
              onClick={handleDownloadExcel}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-600 text-emerald-600 bg-white py-3.5 text-sm font-bold uppercase tracking-wide hover:bg-emerald-50 hover:shadow-md transition-all dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
            >
              <Download size={20} /> Descargar Consolidado (Excel)
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmAction.onConfirm}
        title={confirmAction.title}
        message={confirmAction.message}
        confirmText={confirmAction.confirmText}
        isDestructive={confirmAction.isDestructive}
      />
    </div>
  );
};

export default ConsolidadoView;
