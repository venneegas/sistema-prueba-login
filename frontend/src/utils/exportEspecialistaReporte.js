// c:\Users\edgar\OneDrive\Desktop\prueba\frontend\src\utils\exportEspecialistaReporte.js

import ExcelJS from 'exceljs';

const exportEspecialistaReporte = async ({ trimestreSeleccionado, anioActual, reporte }) => {
  // 1. Crear el libro y la hoja de trabajo
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Reporte Consolidado', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 4 }] // Congelamos las cabeceras
  });

  // 2. Definir las columnas y sus anchos
  ws.columns = [
    { header: '', key: 'n', width: 5 },
    { header: '', key: 'codigo', width: 15 },
    { header: '', key: 'nombre', width: 45 },
    { header: '', key: 'ingresos', width: 20 },
    { header: '', key: 'egresos', width: 20 },
    { header: '', key: 'saldo', width: 20 },
    { header: '', key: 'estado', width: 15 }
  ];

  // 3. Crear el Título Principal (Filas 1 y 2)
  const textTrimestre = trimestreSeleccionado === 'todos' ? 'ANUAL' : `${trimestreSeleccionado}° TRIMESTRE`;
  
  ws.mergeCells('A1:G1');
  const titleCell = ws.getCell('A1');
  titleCell.value = `REPORTE CONSOLIDADO FINANCIERO - ${textTrimestre} ${anioActual}`;
  titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } }; // Azul
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('A2:G2');
  ws.getCell('A2').value = 'Sistema de Gestión de Recursos Propios - UGEL';
  ws.getCell('A2').font = { bold: true };
  ws.getCell('A2').alignment = { horizontal: 'center' };

  ws.addRow([]); // Fila vacía de separación (Fila 3)

  // 4. Crear la Cabecera de la Tabla (Fila 4)
  const headerRow = ws.addRow(['N°', 'Cód. Modular', 'Institución Educativa', 'Total Ingresos', 'Total Egresos', 'Saldo Final', 'Estado']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Gris oscuro
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  // 5. Llenar los datos recibidos de la vista previa
  reporte.forEach((row, index) => {
    const dataRow = ws.addRow([
      index + 1,
      row.codigoModular || '-',
      row.nombre || 'Institución Desconocida',
      Number(row.totalIngresos || 0),
      Number(row.totalEgresos || 0),
      Number(row.saldoTotal || 0),
      row.estado || 'Borrador'
    ]);

    // Formatear las columnas de dinero como Moneda de Soles
    dataRow.getCell(4).numFmt = '"S/." #,##0.00';
    dataRow.getCell(5).numFmt = '"S/." #,##0.00';
    dataRow.getCell(6).numFmt = '"S/." #,##0.00';

    // Agregar bordes a la fila
    dataRow.eachCell(c => {
      c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  // 6. Agregar Totales Finales en la última fila
  const totalIngresos = reporte.reduce((sum, r) => sum + Number(r.totalIngresos || 0), 0);
  const totalEgresos = reporte.reduce((sum, r) => sum + Number(r.totalEgresos || 0), 0);
  const totalSaldo = reporte.reduce((sum, r) => sum + Number(r.saldoTotal || 0), 0);

  const footerRow = ws.addRow(['', '', 'TOTAL GENERAL', totalIngresos, totalEgresos, totalSaldo, '']);
  footerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  
  // Colorear las celdas de totales
  footerRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Negro
  footerRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } }; // Verde (Ingresos)
  footerRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE11D48' } }; // Rojo (Egresos)
  footerRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } }; // Azul (Saldo)
  
  // Formato moneda a totales
  footerRow.getCell(4).numFmt = '"S/." #,##0.00';
  footerRow.getCell(5).numFmt = '"S/." #,##0.00';
  footerRow.getCell(6).numFmt = '"S/." #,##0.00';

  footerRow.eachCell({ includeEmpty: false }, c => {
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  // 7. Generar el Archivo y Forzar la Descarga en el Navegador
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  
  // AQUÍ ESTABLECEMOS EL NOMBRE DEL ARCHIVO DESCARGABLE
  const trimestreNombre = trimestreSeleccionado === 'todos' ? 'Anual' : `T${trimestreSeleccionado}`;
  link.download = `SABANA_DATOS_${trimestreNombre}_${anioActual}.xlsx`;
  
  link.click();
  URL.revokeObjectURL(link.href);
};

export default exportEspecialistaReporte;
