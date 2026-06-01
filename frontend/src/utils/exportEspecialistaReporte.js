import ExcelJS from 'exceljs';

const REPORTES = {
  consolidado: {
    sheetName: 'Consolidado Financiero',
    title: 'REPORTE CONSOLIDADO FINANCIERO',
    filePrefix: 'CONSOLIDADO_FINANCIERO',
    columns: [
      { header: 'N°', key: 'n', width: 6 },
      { header: 'Cod. Modular', key: 'codigoModular', width: 16 },
      { header: 'N° IE', key: 'numeroIE', width: 12 },
      { header: 'Institución Educativa', key: 'nombre', width: 46 },
      { header: 'Total Ingresos', key: 'totalIngresos', width: 18, money: true },
      { header: 'Total Egresos', key: 'totalEgresos', width: 18, money: true },
      { header: 'Saldo Final', key: 'saldoTotal', width: 18, money: true },
      { header: 'Estado', key: 'estado', width: 16 }
    ]
  },
  omisos: {
    sheetName: 'Omisos',
    title: 'REPORTE DE OMISOS',
    filePrefix: 'REPORTE_OMISOS',
    columns: [
      { header: 'N°', key: 'n', width: 6 },
      { header: 'Cod. Modular', key: 'codigoModular', width: 16 },
      { header: 'N° IE', key: 'numeroIE', width: 12 },
      { header: 'Institución Educativa', key: 'nombre', width: 52 },
      { header: 'Estado', key: 'estado', width: 16 },
      { header: 'Observación', key: 'observacion', width: 34 }
    ]
  },
  cuentasCorrientes: {
    sheetName: 'Cuentas Corrientes',
    title: 'REPORTE DE CUENTAS CORRIENTES',
    filePrefix: 'CUENTAS_CORRIENTES',
    columns: [
      { header: 'N°', key: 'n', width: 6 },
      { header: 'Cod. Modular', key: 'codigoModular', width: 16 },
      { header: 'N° IE', key: 'numeroIE', width: 12 },
      { header: 'Institución Educativa', key: 'nombre', width: 46 },
      { header: 'Banco', key: 'banco', width: 24 },
      { header: 'Cuenta Corriente', key: 'numeroCuentaCorriente', width: 24 },
      { header: 'Estado de Cuenta', key: 'estadoCuentaCorriente', width: 18 }
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
      observacion: 'No registra envio para el periodo seleccionado'
    };
  }

  return base;
};

const aplicarEstiloCabecera = (row) => {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
};

const aplicarBordes = (row) => {
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
    cell.alignment = { vertical: 'middle', wrapText: true };
  });
};

const agregarTotalesConsolidado = (ws, reporte) => {
  const totalIngresos = reporte.reduce((sum, r) => sum + Number(r.totalIngresos || 0), 0);
  const totalEgresos = reporte.reduce((sum, r) => sum + Number(r.totalEgresos || 0), 0);
  const totalSaldo = reporte.reduce((sum, r) => sum + Number(r.saldoTotal || 0), 0);

  const footerRow = ws.addRow(['', '', '', 'TOTAL GENERAL', totalIngresos, totalEgresos, totalSaldo, '']);
  footerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  footerRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  footerRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
  footerRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE11D48' } };
  footerRow.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
  footerRow.getCell(5).numFmt = '"S/." #,##0.00';
  footerRow.getCell(6).numFmt = '"S/." #,##0.00';
  footerRow.getCell(7).numFmt = '"S/." #,##0.00';
  aplicarBordes(footerRow);
};

const exportEspecialistaReporte = async ({
  trimestreSeleccionado,
  anioActual,
  reporte,
  tipoReporte = 'consolidado'
}) => {
  const config = REPORTES[tipoReporte] || REPORTES.consolidado;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(config.sheetName, {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 4 }]
  });

  ws.columns = config.columns.map((column) => ({
    header: '',
    key: column.key,
    width: column.width
  }));

  const lastColumnLetter = ws.getColumn(config.columns.length).letter;
  const periodoText = getPeriodoText(trimestreSeleccionado, anioActual);

  ws.mergeCells(`A1:${lastColumnLetter}1`);
  const titleCell = ws.getCell('A1');
  titleCell.value = `${config.title} - ${periodoText}`;
  titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells(`A2:${lastColumnLetter}2`);
  ws.getCell('A2').value = 'Sistema de Gestión de Recursos Propios - UGEL';
  ws.getCell('A2').font = { bold: true };
  ws.getCell('A2').alignment = { horizontal: 'center' };

  ws.addRow([]);

  const headerRow = ws.addRow(config.columns.map((column) => column.header));
  aplicarEstiloCabecera(headerRow);

  reporte.forEach((row, index) => {
    const normalized = normalizarFila(row, index, tipoReporte);
    const dataRow = ws.addRow(config.columns.map((column) => normalized[column.key]));

    config.columns.forEach((column, columnIndex) => {
      if (column.money) {
        dataRow.getCell(columnIndex + 1).numFmt = '"S/." #,##0.00';
      }
    });

    aplicarBordes(dataRow);
  });

  if (tipoReporte === 'consolidado') {
    agregarTotalesConsolidado(ws, reporte);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${config.filePrefix}_${getFilePeriodo(trimestreSeleccionado, anioActual)}.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default exportEspecialistaReporte;
