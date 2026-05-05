import ExcelJS from 'exceljs';

const exportEspecialistaReporte = async ({ trimestreSeleccionado, anioActual, reporte }) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Reporte T${trimestreSeleccionado} ${anioActual}`);

  worksheet.columns = [
    { header: 'Codigo Modular', key: 'codigoModular', width: 18 },
    { header: 'Institucion Educativa', key: 'nombre', width: 45 },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'Total Ingresos (S/)', key: 'ingresos', width: 22, style: { numFmt: '"S/"#,##0.00' } },
    { header: 'Total Egresos (S/)', key: 'egresos', width: 22, style: { numFmt: '"S/"#,##0.00' } },
    { header: 'Saldo Final (S/)', key: 'saldo', width: 22, style: { numFmt: '"S/"#,##0.00' } }
  ];

  reporte.forEach((item) => {
    worksheet.addRow({
      codigoModular: item.codigoModular,
      nombre: item.nombre,
      estado: item.estado,
      ingresos: Number(item.totalIngresos),
      egresos: Number(item.totalEgresos),
      saldo: Number(item.saldoFinal)
    });
  });

  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Reporte_Global_UGEL_T${trimestreSeleccionado}_${anioActual}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export default exportEspecialistaReporte;
