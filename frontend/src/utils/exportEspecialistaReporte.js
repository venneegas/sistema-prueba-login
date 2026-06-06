import ExcelJS from 'exceljs';

const MONEY_FORMAT = '"S/." #,##0.00';
const BORDER_THIN = {
  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
};

const REPORTES = {
  consolidado: {
    sheetName: 'Consolidado Financiero',
    title: 'REPORTE CONSOLIDADO FINANCIERO',
    filePrefix: 'CONSOLIDADO_FINANCIERO',
    color: 'FF0284C7',
    columns: [
      { header: 'N°', key: 'n', width: 7, align: 'center' },
      { header: 'Cod. Modular', key: 'codigoModular', width: 16, align: 'center' },
      { header: 'N° IE', key: 'numeroIE', width: 12, align: 'center' },
      { header: 'Institución Educativa', key: 'nombre', width: 48, align: 'left' },
      { header: 'Total Ingresos', key: 'totalIngresos', width: 18, money: true, align: 'right' },
      { header: 'Total Egresos', key: 'totalEgresos', width: 18, money: true, align: 'right' },
      { header: 'Saldo Final', key: 'saldoTotal', width: 18, money: true, align: 'right' },
      { header: 'Estado', key: 'estado', width: 16, align: 'center' }
    ]
  },
  omisos: {
    sheetName: 'Omisos',
    title: 'REPORTE DE OMISOS',
    filePrefix: 'REPORTE_OMISOS',
    color: 'FF64748B',
    columns: [
      { header: 'N°', key: 'n', width: 7, align: 'center' },
      { header: 'Cod. Modular', key: 'codigoModular', width: 16, align: 'center' },
      { header: 'N° IE', key: 'numeroIE', width: 12, align: 'center' },
      { header: 'Institución Educativa', key: 'nombre', width: 54, align: 'left' },
      { header: 'Estado', key: 'estado', width: 16, align: 'center' },
      { header: 'Observación', key: 'observacion', width: 38, align: 'left' }
    ]
  },
  cuentasCorrientes: {
    sheetName: 'Cuentas Corrientes',
    title: 'REPORTE DE CUENTAS CORRIENTES',
    filePrefix: 'CUENTAS_CORRIENTES',
    color: 'FF0F766E',
    columns: [
      { header: 'N°', key: 'n', width: 7, align: 'center' },
      { header: 'Cod. Modular', key: 'codigoModular', width: 16, align: 'center' },
      { header: 'N° IE', key: 'numeroIE', width: 12, align: 'center' },
      { header: 'Institución Educativa', key: 'nombre', width: 48, align: 'left' },
      { header: 'Banco', key: 'banco', width: 24, align: 'left' },
      { header: 'Cuenta Corriente', key: 'numeroCuentaCorriente', width: 24, align: 'center' },
      { header: 'Estado de Cuenta', key: 'estadoCuentaCorriente', width: 18, align: 'center' }
    ]
  },
  rankingRecaudacion: {
    sheetName: 'Ranking',
    title: 'RANKING DE RECAUDACIÓN',
    filePrefix: 'RANKING_RECAUDACION',
    color: 'FF4F46E5',
    columns: [
      { header: 'Puesto', key: 'n', width: 9, align: 'center' },
      { header: 'Cod. Modular', key: 'codigoModular', width: 16, align: 'center' },
      { header: 'N° IE', key: 'numeroIE', width: 12, align: 'center' },
      { header: 'Institución Educativa', key: 'nombre', width: 52, align: 'left' },
      { header: 'Monto', key: 'monto', width: 18, money: true, align: 'right' },
      { header: 'Estado', key: 'estado', width: 16, align: 'center' }
    ]
  }
};

const tieneCuentaCorriente = (row) => String(row.numeroCuentaCorriente || '').trim().length > 0;

const getPeriodoText = (trimestreSeleccionado, anioActual) => {
  const trimestreText = trimestreSeleccionado === 'todos'
    ? 'ANUAL'
    : `${trimestreSeleccionado}° TRIMESTRE`;

  return `${trimestreText} ${anioActual}`;
};

const getFilePeriodo = (trimestreSeleccionado, anioActual) => {
  const trimestreText = trimestreSeleccionado === 'todos' ? 'ANUAL' : `T${trimestreSeleccionado}`;
  return `${trimestreText}_${anioActual}`;
};

const normalizarFila = (row, index, tipoReporte) => {
  const base = {
    n: index + 1,
    codigoModular: row.codigoModular || '-',
    numeroIE: row.numeroIE || '-',
    nombre: row.nombre || 'Institución Desconocida',
    estado: row.estado || 'Borrador',
    totalIngresos: Number(row.totalIngresos || 0),
    totalEgresos: Number(row.totalEgresos || 0),
    saldoTotal: Number(row.saldoTotal || 0),
    banco: row.banco || '-',
    numeroCuentaCorriente: row.numeroCuentaCorriente || '-',
    estadoCuentaCorriente: tieneCuentaCorriente(row) ? 'Con cuenta' : 'Sin cuenta'
  };

  if (tipoReporte === 'omisos') {
    return {
      ...base,
      observacion: 'No registra envío para el periodo seleccionado'
    };
  }

  return base;
};

const prepararWorkbook = () => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistema de Gestión de Recursos Propios - UGEL';
  wb.created = new Date();
  wb.modified = new Date();
  return wb;
};

const prepararWorksheet = (wb, config) => {
  const ws = wb.addWorksheet(config.sheetName, {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 4, showGridLines: false }]
  });

  ws.properties.defaultRowHeight = 22;
  ws.pageSetup = {
    orientation: config.columns.length > 6 ? 'landscape' : 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: { left: 0.25, right: 0.25, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2 }
  };

  ws.columns = config.columns.map((column) => ({
    header: '',
    key: column.key,
    width: column.width
  }));

  return ws;
};

const aplicarEstiloCabecera = (row) => {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.height = 24;
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = BORDER_THIN;
  });
};

const aplicarEstiloFila = (row, columns, index) => {
  row.eachCell((cell, columnNumber) => {
    const column = columns[columnNumber - 1];
    cell.border = BORDER_THIN;
    cell.alignment = {
      horizontal: column?.align || 'left',
      vertical: 'middle',
      wrapText: true
    };

    if (column?.money) {
      cell.numFmt = MONEY_FORMAT;
    }

    if (index % 2 === 1) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  });
};

const agregarTitulo = (ws, config, periodoText, title = config.title) => {
  const lastColumnLetter = ws.getColumn(config.columns.length).letter;

  ws.mergeCells(`A1:${lastColumnLetter}1`);
  const titleCell = ws.getCell('A1');
  titleCell.value = `${title} - ${periodoText}`;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: config.color } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  ws.getRow(1).height = 28;

  ws.mergeCells(`A2:${lastColumnLetter}2`);
  const subtitleCell = ws.getCell('A2');
  subtitleCell.value = 'Sistema de Gestión de Recursos Propios - UGEL';
  subtitleCell.font = { bold: true, color: { argb: 'FF334155' } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 20;

  ws.addRow([]);
};

const agregarTotalesConsolidado = (ws, reporte) => {
  const totalIngresos = reporte.reduce((sum, r) => sum + Number(r.totalIngresos || 0), 0);
  const totalEgresos = reporte.reduce((sum, r) => sum + Number(r.totalEgresos || 0), 0);
  const totalSaldo = reporte.reduce((sum, r) => sum + Number(r.saldoTotal || 0), 0);

  const footerRow = ws.addRow(['', '', '', 'TOTAL GENERAL', totalIngresos, totalEgresos, totalSaldo, '']);
  footerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  [4, 5, 6, 7].forEach((cellNumber) => {
    footerRow.getCell(cellNumber).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    footerRow.getCell(cellNumber).border = BORDER_THIN;
    footerRow.getCell(cellNumber).alignment = {
      horizontal: cellNumber === 4 ? 'center' : 'right',
      vertical: 'middle'
    };
  });
  [5, 6, 7].forEach((cellNumber) => {
    footerRow.getCell(cellNumber).numFmt = MONEY_FORMAT;
  });
  footerRow.height = 24;
};

const finalizarWorksheet = (ws, config, headerRow, lastDataRowNumber) => {
  ws.autoFilter = {
    from: { row: headerRow.number, column: 1 },
    to: { row: lastDataRowNumber, column: config.columns.length }
  };
  ws.pageSetup.printArea = `A1:${ws.getColumn(config.columns.length).letter}${ws.lastRow.number}`;
};

const agregarHojaRanking = ({ wb, sheetName, title, periodoText, reporte, dataKey }) => {
  const config = { ...REPORTES.rankingRecaudacion, sheetName };
  const ws = prepararWorksheet(wb, config);
  agregarTitulo(ws, config, periodoText, title);

  const headerRow = ws.addRow(config.columns.map((column) => column.header));
  aplicarEstiloCabecera(headerRow);

  const ranking = [...reporte].sort((a, b) => Number(b[dataKey] || 0) - Number(a[dataKey] || 0));

  ranking.forEach((row, index) => {
    const dataRow = ws.addRow([
      index + 1,
      row.codigoModular || '-',
      row.numeroIE || '-',
      row.nombre || 'Institución Desconocida',
      Number(row[dataKey] || 0),
      row.estado || 'Borrador'
    ]);

    aplicarEstiloFila(dataRow, config.columns, index);
  });

  finalizarWorksheet(ws, config, headerRow, ws.lastRow.number);
};

const descargarWorkbook = async (wb, filename) => {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

const exportEspecialistaReporte = async ({
  trimestreSeleccionado,
  anioActual,
  reporte,
  tipoReporte = 'consolidado'
}) => {
  if (tipoReporte === 'rankingRecaudacion') {
    const wb = prepararWorkbook();
    const periodoText = getPeriodoText(trimestreSeleccionado, anioActual);

    agregarHojaRanking({
      wb,
      sheetName: 'Ranking Ingresos',
      title: 'RANKING DE RECAUDACIÓN DE INGRESOS',
      periodoText,
      reporte,
      dataKey: 'totalIngresos'
    });

    agregarHojaRanking({
      wb,
      sheetName: 'Ranking Egresos',
      title: 'RANKING DE EGRESOS',
      periodoText,
      reporte,
      dataKey: 'totalEgresos'
    });

    await descargarWorkbook(
      wb,
      `${REPORTES.rankingRecaudacion.filePrefix}_${getFilePeriodo(trimestreSeleccionado, anioActual)}.xlsx`
    );
    return;
  }

  const config = REPORTES[tipoReporte] || REPORTES.consolidado;
  const wb = prepararWorkbook();
  const ws = prepararWorksheet(wb, config);
  const periodoText = getPeriodoText(trimestreSeleccionado, anioActual);

  agregarTitulo(ws, config, periodoText);

  const headerRow = ws.addRow(config.columns.map((column) => column.header));
  aplicarEstiloCabecera(headerRow);

  reporte.forEach((row, index) => {
    const normalized = normalizarFila(row, index, tipoReporte);
    const dataRow = ws.addRow(config.columns.map((column) => normalized[column.key]));
    aplicarEstiloFila(dataRow, config.columns, index);
  });

  if (tipoReporte === 'consolidado') {
    agregarTotalesConsolidado(ws, reporte);
  }

  finalizarWorksheet(ws, config, headerRow, ws.lastRow.number);

  await descargarWorkbook(
    wb,
    `${config.filePrefix}_${getFilePeriodo(trimestreSeleccionado, anioActual)}.xlsx`
  );
};

export default exportEspecialistaReporte;
