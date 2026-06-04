import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoUrl from '../assets/LOGO.jpeg'; 

// ==========================================
// ESTILOS GLOBALES (ESCALA DE AZULES)
// ==========================================
const crearEncabezadoAzul = (titulo) => [
  { content: titulo, colSpan: 4, styles: { halign: 'center', fillColor: [21, 101, 192], textColor: [255, 255, 255], fontSize: 11, fontStyle: 'bold' } }
];

const estilosFichaMedica = {
  theme: 'grid',
  styles: { fontSize: 9, cellPadding: 6, lineColor: [160, 190, 220], lineWidth: 0.5 },
  columnStyles: {
    0: { fontStyle: 'bold', fillColor: [237, 246, 255], cellWidth: '20%', textColor: [30, 58, 138] },
    1: { cellWidth: '30%', textColor: [40, 40, 40], fillColor: [255, 255, 255] },
    2: { fontStyle: 'bold', fillColor: [237, 246, 255], cellWidth: '20%', textColor: [30, 58, 138] },
    3: { cellWidth: '30%', textColor: [40, 40, 40], fillColor: [255, 255, 255] }
  },
  margin: { left: 40, right: 40 }
};

const loadImage = (url) => {
  return new Promise((resolve) => {
    const img = new Image(); img.src = url; img.onload = () => resolve(img); img.onerror = () => resolve(null);
  });
};

// ==========================================
// 1. REPORTE GENERAL BÁSICO (FLOTA / CHOFERES)
// ==========================================
export const generarPDF = async (titulo, columnas, datos, nombreArchivo) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const logoImg = await loadImage(logoUrl);

  if (logoImg) {
    let imgHeight = 65; let imgWidth = imgHeight * (logoImg.width / logoImg.height);
    if (imgWidth > 300) { imgWidth = 300; imgHeight = imgWidth * (logoImg.height / logoImg.width); }
    doc.addImage(logoImg, 'JPEG', 40, 25, imgWidth, imgHeight); 
  } else {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(21, 101, 192); doc.text("SOMILOR S.A.", 40, 60);
  }

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(30, 58, 138);
  doc.text("SISTEMA DE GESTIÓN DE FLOTAS", pageWidth - 40, 45, { align: 'right' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
  doc.text(`Fecha Impresión: ${new Date().toLocaleDateString('es-EC')}`, pageWidth - 40, 60, { align: 'right' });

  const lineaY = 100;
  doc.setLineWidth(1.5); doc.setDrawColor(21, 101, 192); doc.line(40, lineaY, pageWidth - 40, lineaY);

  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(21, 101, 192);
  doc.text(titulo.toUpperCase(), 40, lineaY + 30);
  doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
  doc.text("Documento general exportado desde el sistema central.", 40, lineaY + 48);

  const bodyData = datos.map(fila => columnas.map(col => col.render ? col.render(fila) : (fila[col.dataKey] || '—')));

  autoTable(doc, {
    startY: lineaY + 65,
    head: [columnas.map(col => col.header)],
    body: bodyData,
    theme: 'grid', 
    headStyles: { fillColor: [21, 101, 192], textColor: [255, 255, 255], lineColor: [160, 190, 220], lineWidth: 0.5, halign: 'left', fontStyle: 'bold', fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 6, textColor: [40, 40, 40], lineColor: [160, 190, 220], lineWidth: 0.5 },
    alternateRowStyles: { fillColor: [245, 250, 255] },
    didDrawPage: function (data) {
      if (logoImg) {
        doc.setGState(new doc.GState({ opacity: 0.08 }));
        const wmWidth = 400; const wmHeight = wmWidth * (logoImg.height / logoImg.width);
        doc.addImage(logoImg, 'JPEG', (pageWidth - wmWidth) / 2, (pageHeight - wmHeight) / 2, wmWidth, wmHeight);
        doc.setGState(new doc.GState({ opacity: 1.0 }));
      }
      doc.setDrawColor(21, 101, 192); doc.setLineWidth(1); doc.line(40, pageHeight - 45, pageWidth - 40, pageHeight - 45);
      doc.setFontSize(8); doc.setTextColor(30, 58, 138);
      doc.text(`Generado: ${new Date().toLocaleString('es-EC')}`, 40, pageHeight - 25);
      doc.text("Control de Flotas - SOMILOR", pageWidth / 2, pageHeight - 25, { align: 'center' });
      doc.text(`Página ${data.pageNumber} de ${doc.internal.getNumberOfPages()}`, pageWidth - 40, pageHeight - 25, { align: 'right' });
    }
  });

  doc.save(`${nombreArchivo}.pdf`);
};

// ==========================================
// 2. REPORTE DE COMBUSTIBLE (LISTA + FICHA RESUMEN + TOTALES)
// ==========================================
export const generarReporteCombustiblePDF = async (titulo, datos, nombreArchivo) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const logoImg = await loadImage(logoUrl);

  if (logoImg) {
    let imgHeight = 65; let imgWidth = imgHeight * (logoImg.width / logoImg.height);
    if (imgWidth > 300) { imgWidth = 300; imgHeight = imgWidth * (logoImg.height / logoImg.width); }
    doc.addImage(logoImg, 'JPEG', 40, 25, imgWidth, imgHeight); 
  } else {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(21, 101, 192); doc.text("SOMILOR S.A.", 40, 60);
  }

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(30, 58, 138);
  doc.text("SISTEMA DE GESTIÓN DE FLOTAS", pageWidth - 40, 45, { align: 'right' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
  doc.text(`Fecha Impresión: ${new Date().toLocaleDateString('es-EC')}`, pageWidth - 40, 60, { align: 'right' });

  const lineaY = 100;
  doc.setLineWidth(1.5); doc.setDrawColor(21, 101, 192); doc.line(40, lineaY, pageWidth - 40, lineaY);

  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(21, 101, 192);
  doc.text(titulo.toUpperCase(), 40, lineaY + 30);
  doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
  doc.text("Resumen financiero y operativo de abastecimiento.", 40, lineaY + 48);

  // Cálculos de Totales
  const totalGalones = datos.reduce((acc, t) => acc + (parseFloat(t.galones) || 0), 0);
  const totalCosto = datos.reduce((acc, t) => acc + (parseFloat(t.costo_total) || 0), 0);

  // Tabla Resumen tipo Ficha
  autoTable(doc, {
    ...estilosFichaMedica,
    startY: lineaY + 65,
    head: [crearEncabezadoAzul('RESUMEN DEL PERÍODO')],
    body: [
      ['Período Evaluado', titulo.replace('Reporte de Combustible - ', ''), 'Total de Registros', datos.length.toString()],
      ['Galones Consumidos', `${totalGalones.toFixed(2)} gal`, 'Inversión Total', `$${totalCosto.toFixed(2)}`]
    ]
  });

  // Tabla de Datos con Footer de Sumas
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [['Fecha', 'Unidad', 'Chofer', 'Galones', 'Costo ($)', 'Observaciones']],
    body: datos.map(t => [
      new Date(t.fecha).toLocaleDateString('es-EC'),
      t.vehiculo?.placa || `V-${t.vehiculo_id}`,
      t.chofer ? `${t.chofer.nombre} ${t.chofer.apellido}` : 'Sin asignar',
      t.galones ? `${t.galones}` : '0',
      `$${(t.costo_total || 0).toFixed(2)}`,
      t.observaciones || '—'
    ]),
    foot: [[
      { content: 'SUMA TOTAL:', colSpan: 3, styles: { halign: 'right', fillColor: [21, 101, 192], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 } },
      { content: `${totalGalones.toFixed(2)}`, styles: { fillColor: [21, 101, 192], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 } },
      { content: `$${totalCosto.toFixed(2)}`, styles: { fillColor: [21, 101, 192], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 } },
      { content: '', styles: { fillColor: [21, 101, 192] } }
    ]],
    showFoot: 'lastPage', 
    theme: 'grid', 
    headStyles: { fillColor: [21, 101, 192], textColor: [255, 255, 255], lineColor: [160, 190, 220], lineWidth: 0.5, fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 5, textColor: [40, 40, 40], lineColor: [160, 190, 220], lineWidth: 0.5 },
    alternateRowStyles: { fillColor: [245, 250, 255] },
    didDrawPage: function (data) {
      if (logoImg) {
        doc.setGState(new doc.GState({ opacity: 0.08 }));
        const wmWidth = 400; const wmHeight = wmWidth * (logoImg.height / logoImg.width);
        doc.addImage(logoImg, 'JPEG', (pageWidth - wmWidth) / 2, (pageHeight - wmHeight) / 2, wmWidth, wmHeight);
        doc.setGState(new doc.GState({ opacity: 1.0 }));
      }
      doc.setDrawColor(21, 101, 192); doc.setLineWidth(1); doc.line(40, pageHeight - 45, pageWidth - 40, pageHeight - 45);
      doc.setFontSize(8); doc.setTextColor(30, 58, 138);
      doc.text(`Generado: ${new Date().toLocaleString('es-EC')}`, 40, pageHeight - 25);
      doc.text("Control de Flotas - SOMILOR", pageWidth / 2, pageHeight - 25, { align: 'center' });
      doc.text(`Página ${data.pageNumber} de ${doc.internal.getNumberOfPages()}`, pageWidth - 40, pageHeight - 25, { align: 'right' });
    }
  });

  doc.save(`${nombreArchivo}.pdf`);
};

// ==========================================
// 3. REPORTE DE MANTENIMIENTOS (LISTA + FICHA RESUMEN + TOTALES)
// ==========================================
export const generarReporteMantenimientoPDF = async (titulo, datos, nombreArchivo) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const logoImg = await loadImage(logoUrl);

  if (logoImg) {
    let imgHeight = 65; let imgWidth = imgHeight * (logoImg.width / logoImg.height);
    if (imgWidth > 300) { imgWidth = 300; imgHeight = imgWidth * (logoImg.height / logoImg.width); }
    doc.addImage(logoImg, 'JPEG', 40, 25, imgWidth, imgHeight); 
  } else {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(21, 101, 192); doc.text("SOMILOR S.A.", 40, 60);
  }

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(30, 58, 138);
  doc.text("SISTEMA DE GESTIÓN DE FLOTAS", pageWidth - 40, 45, { align: 'right' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
  doc.text(`Fecha Impresión: ${new Date().toLocaleDateString('es-EC')}`, pageWidth - 40, 60, { align: 'right' });

  const lineaY = 100;
  doc.setLineWidth(1.5); doc.setDrawColor(21, 101, 192); doc.line(40, lineaY, pageWidth - 40, lineaY);

  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(21, 101, 192);
  doc.text(titulo.toUpperCase(), 40, lineaY + 30);
  doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
  doc.text("Resumen de intervenciones preventivas y correctivas.", 40, lineaY + 48);

  const totalCosto = datos.reduce((acc, m) => acc + (parseFloat(m.costo) || 0), 0);

  // Ficha Médica Resumen
  autoTable(doc, {
    ...estilosFichaMedica,
    startY: lineaY + 65,
    head: [crearEncabezadoAzul('RESUMEN DEL PERÍODO')],
    body: [
      ['Período / Filtro', titulo.replace('Reporte de Mantenimientos - ', ''), 'Total de Registros', datos.length.toString()],
      ['Intervenciones', `${datos.length} trabajos`, 'Inversión Total', `$${totalCosto.toFixed(2)}`]
    ]
  });

  // Tabla de Datos con Footer de Sumas
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [['F. Programada', 'Unidad', 'Tipo', 'Descripción', 'Estado', 'Costo ($)']],
    body: datos.map(m => [
      m.fecha_programada ? new Date(m.fecha_programada).toLocaleDateString('es-EC') : '—',
      m.vehiculo?.placa || `V-${m.vehiculo_id}`,
      m.tipo ? m.tipo.toUpperCase() : '—',
      m.descripcion || '—',
      m.estado ? m.estado.replace('_', ' ').toUpperCase() : '—',
      m.costo ? `$${m.costo.toFixed(2)}` : '—'
    ]),
    foot: [[
      { content: 'INVERSIÓN TOTAL:', colSpan: 5, styles: { halign: 'right', fillColor: [21, 101, 192], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 } },
      { content: `$${totalCosto.toFixed(2)}`, styles: { fillColor: [21, 101, 192], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 } }
    ]],
    showFoot: 'lastPage',
    theme: 'grid', 
    headStyles: { fillColor: [21, 101, 192], textColor: [255, 255, 255], lineColor: [160, 190, 220], lineWidth: 0.5, fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 5, textColor: [40, 40, 40], lineColor: [160, 190, 220], lineWidth: 0.5 },
    alternateRowStyles: { fillColor: [245, 250, 255] },
    didDrawPage: function (data) {
      if (logoImg) {
        doc.setGState(new doc.GState({ opacity: 0.08 }));
        const wmWidth = 400; const wmHeight = wmWidth * (logoImg.height / logoImg.width);
        doc.addImage(logoImg, 'JPEG', (pageWidth - wmWidth) / 2, (pageHeight - wmHeight) / 2, wmWidth, wmHeight);
        doc.setGState(new doc.GState({ opacity: 1.0 }));
      }
      doc.setDrawColor(21, 101, 192); doc.setLineWidth(1); doc.line(40, pageHeight - 45, pageWidth - 40, pageHeight - 45);
      doc.setFontSize(8); doc.setTextColor(30, 58, 138);
      doc.text(`Generado: ${new Date().toLocaleString('es-EC')}`, 40, pageHeight - 25);
      doc.text("Control de Flotas - SOMILOR", pageWidth / 2, pageHeight - 25, { align: 'center' });
      doc.text(`Página ${data.pageNumber} de ${doc.internal.getNumberOfPages()}`, pageWidth - 40, pageHeight - 25, { align: 'right' });
    }
  });

  doc.save(`${nombreArchivo}.pdf`);
};

// ==========================================
// 4. FICHA INDIVIDUAL: VEHÍCULO (CON ANEXOS)
// ==========================================
export const generarFichaVehiculoPDF = async (vehiculo, opciones = { comb: false, mant: false }, datosComb = [], datosMant = []) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const logoImg = await loadImage(logoUrl);

  // 1. Cabecera Corporativa
  if (logoImg) {
    let imgHeight = 65; let imgWidth = imgHeight * (logoImg.width / logoImg.height);
    if (imgWidth > 300) { imgWidth = 300; imgHeight = imgWidth * (logoImg.height / logoImg.width); }
    doc.addImage(logoImg, 'JPEG', 40, 25, imgWidth, imgHeight); 
  } else {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(21, 101, 192); doc.text('SOMILOR S.A.', 40, 60);
  }
  
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(30, 58, 138);
  doc.text("SISTEMA DE GESTIÓN DE FLOTAS", pageWidth - 40, 45, { align: 'right' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
  doc.text(`Fecha Impresión: ${new Date().toLocaleDateString('es-EC')}`, pageWidth - 40, 60, { align: 'right' });

  // CORRECCIÓN: Posición exacta de la Placa
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(30, 58, 138);
  doc.text(`PLACA: ${vehiculo.placa || 'N/A'}`, pageWidth - 40, 78, { align: 'right' });

  const lineaY = 100;
  doc.setLineWidth(1.5); doc.setDrawColor(21, 101, 192); doc.line(40, lineaY, pageWidth - 40, lineaY);

  const textoAnio = vehiculo.anio ? `(${vehiculo.anio})` : '';
  const nombreVehiculo = `${vehiculo.marca || ''} ${vehiculo.modelo || ''} ${textoAnio} ${vehiculo.color || ''}`.trim().replace(/\s+/g, ' ').toUpperCase();

  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(21, 101, 192); 
  doc.text(nombreVehiculo || 'UNIDAD SIN DETALLES', 40, lineaY + 30);
  doc.setFontSize(12); doc.setTextColor(80, 80, 80); doc.text('FICHA TÉCNICA DE EQUIPO / VEHÍCULO', 40, lineaY + 48);

  autoTable(doc, { ...estilosFichaMedica, startY: lineaY + 65, head: [crearEncabezadoAzul('1. DATOS BASE')],
    body: [
      ['Placa Actual', vehiculo.placa || '-', 'Placa Anterior', vehiculo.placa_anterior || '-'],
      ['Marca', vehiculo.marca || '-', 'Modelo', vehiculo.modelo || '-'],
      ['Año Fabricación', vehiculo.anio ? vehiculo.anio.toString() : '-', 'País Origen', vehiculo.pais_origen || '-'],
      ['Color Principal', vehiculo.color || '-', 'Color Secundario', vehiculo.color_secundario || '-'],
      ['Uso Registrado', { content: `${vehiculo.kilometraje_actual || 0} ${vehiculo.tipo === 'maquinaria' ? 'hrs' : 'km'}`, colSpan: 3 }]
    ]
  });

  autoTable(doc, { ...estilosFichaMedica, startY: doc.lastAutoTable.finalY + 15, head: [crearEncabezadoAzul('2. ESPECIFICACIONES TÉCNICAS')],
    body: [
      ['Tipo de Vehículo', vehiculo.tipo ? vehiculo.tipo.toUpperCase() : '-', 'Clase Vehículo', vehiculo.clase_vehiculo || '-'],
      ['Nro. Especie', vehiculo.numero_especie || '-', 'Carrocería', vehiculo.carroceria || '-'],
      ['Motor', vehiculo.numero_motor || '-', 'Chasis', vehiculo.numero_chasis || '-'],
      ['Combustible', vehiculo.tipo_combustible || '-', 'Pasajeros', vehiculo.capacidad_pasajeros || '-'],
      ['Cilindraje (cc)', vehiculo.cilindraje || '-', 'Tonelaje (t)', vehiculo.tonelaje || '-']
    ]
  });

  autoTable(doc, { ...estilosFichaMedica, startY: doc.lastAutoTable.finalY + 15, head: [crearEncabezadoAzul('3. DATOS LEGALES Y DE PROPIEDAD')],
    body: [
      ['Titular', { content: vehiculo.titular_nombres || '-', colSpan: 3 }],
      ['C.I. / RUC', vehiculo.titular_identificacion || '-', 'Teléfono', vehiculo.titular_telefono || '-'],
      ['Residencia', { content: vehiculo.titular_residencia || '-', colSpan: 3 }],
      ['Dirección', { content: vehiculo.titular_direccion || '-', colSpan: 3 }],
      ['Operadora Transp.', { content: vehiculo.operadora_transporte || '-', colSpan: 3 }],
      ['Nro. Título Hab.', vehiculo.numero_titulo_habilitante || '-', 'RUAT', vehiculo.ruat || '-'],
      ['Ámbito', vehiculo.ambito_transporte || '-', 'Tipo Transporte', vehiculo.matricula_tipo_transporte || '-'],
      ['Clase Transporte', vehiculo.matricula_clase_transporte || '-', 'Digitador', vehiculo.digitador_matricula || '-'],
      ['Fecha Matrícula', vehiculo.fecha_matricula ? new Date(vehiculo.fecha_matricula).toLocaleDateString('es-EC') : '-', 'Caducidad Mat.', vehiculo.fecha_expiracion_matricula ? new Date(vehiculo.fecha_expiracion_matricula).toLocaleDateString('es-EC') : '-'],
      ['Avalúo', { content: vehiculo.avaluo_vehiculo ? `$${vehiculo.avaluo_vehiculo.toFixed(2)}` : '-', colSpan: 3 }],
      ['Observaciones', { content: vehiculo.observacion_matricula || '-', colSpan: 3 }]
    ]
  });

  let currentY = doc.lastAutoTable.finalY + 60;
  if (currentY < (pageHeight - 60)) {
    doc.setLineWidth(1); doc.setDrawColor(21, 101, 192); 
    doc.line(80, currentY, 240, currentY); doc.setFontSize(9); doc.setTextColor(30, 58, 138); doc.text('Firma Responsable', 160, currentY + 15, { align: 'center' });
    doc.line(pageWidth - 240, currentY, pageWidth - 80, currentY); doc.text('Firma Digitador', pageWidth - 160, currentY + 15, { align: 'center' });
  }

  // ==========================================
  // SECCIÓN OPCIONAL: ANEXOS (COMBUSTIBLE Y MANTENIMIENTO)
  // ==========================================
  if (opciones.comb || opciones.mant) {
    doc.addPage();
    let anexoY = 60;
    
    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(21, 101, 192); 
    doc.text('ANEXOS: HISTORIAL OPERATIVO DE LA UNIDAD', 40, anexoY);
    anexoY += 25;

    if (opciones.comb) {
      doc.setFontSize(12); doc.setTextColor(30, 58, 138); doc.text('Historial de Abastecimiento de Combustible', 40, anexoY);
      anexoY += 10;
      
      const totalGalones = datosComb.reduce((acc, t) => acc + (parseFloat(t.galones) || 0), 0);
      const totalCostoComb = datosComb.reduce((acc, t) => acc + (parseFloat(t.costo_total) || 0), 0);
      const bodyComb = datosComb.map(t => [
        new Date(t.fecha).toLocaleDateString('es-EC'),
        t.galones ? `${t.galones} gal` : '—',
        `$${(t.costo_total || 0).toFixed(2)}`,
        t.observaciones || '—'
      ]);

      autoTable(doc, {
        startY: anexoY,
        head: [['Fecha', 'Galones', 'Costo ($)', 'Observaciones']],
        body: bodyComb.length > 0 ? bodyComb : [['Sin registros', '', '', '']],
        foot: bodyComb.length > 0 ? [[
          { content: 'SUMA TOTAL:', styles: { halign: 'right', fillColor: [21, 101, 192], textColor: [255, 255, 255], fontStyle: 'bold' } },
          { content: `${totalGalones.toFixed(2)} gal`, styles: { fillColor: [21, 101, 192], textColor: [255, 255, 255], fontStyle: 'bold' } },
          { content: `$${totalCostoComb.toFixed(2)}`, styles: { fillColor: [21, 101, 192], textColor: [255, 255, 255], fontStyle: 'bold' } },
          { content: '', styles: { fillColor: [21, 101, 192] } }
        ]] : false,
        showFoot: 'lastPage',
        theme: 'grid', 
        headStyles: { fillColor: [21, 101, 192], textColor: [255, 255, 255], lineColor: [160, 190, 220], lineWidth: 0.5, fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 5, textColor: [40, 40, 40], lineColor: [160, 190, 220], lineWidth: 0.5 },
        alternateRowStyles: { fillColor: [245, 250, 255] }
      });
      anexoY = doc.lastAutoTable.finalY + 30;
    }

    if (opciones.mant) {
      if (anexoY > pageHeight - 150) { doc.addPage(); anexoY = 60; }
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 58, 138); doc.text('Historial de Mantenimientos', 40, anexoY);
      anexoY += 10;

      const totalCostoMant = datosMant.reduce((acc, m) => acc + (parseFloat(m.costo) || 0), 0);
      const bodyMant = datosMant.map(m => [
        m.fecha_programada ? new Date(m.fecha_programada).toLocaleDateString('es-EC') : '—',
        m.tipo ? m.tipo.toUpperCase() : '—',
        m.descripcion || '—',
        m.estado ? m.estado.replace('_', ' ').toUpperCase() : '—',
        m.costo ? `$${m.costo.toFixed(2)}` : '—'
      ]);

      autoTable(doc, {
        startY: anexoY,
        head: [['F. Programada', 'Tipo', 'Descripción', 'Estado', 'Costo ($)']],
        body: bodyMant.length > 0 ? bodyMant : [['Sin registros', '', '', '', '']],
        foot: bodyMant.length > 0 ? [[
          { content: 'INVERSIÓN TOTAL:', colSpan: 4, styles: { halign: 'right', fillColor: [21, 101, 192], textColor: [255, 255, 255], fontStyle: 'bold' } },
          { content: `$${totalCostoMant.toFixed(2)}`, styles: { fillColor: [21, 101, 192], textColor: [255, 255, 255], fontStyle: 'bold' } }
        ]] : false,
        showFoot: 'lastPage',
        theme: 'grid', 
        headStyles: { fillColor: [21, 101, 192], textColor: [255, 255, 255], lineColor: [160, 190, 220], lineWidth: 0.5, fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 5, textColor: [40, 40, 40], lineColor: [160, 190, 220], lineWidth: 0.5 },
        alternateRowStyles: { fillColor: [245, 250, 255] }
      });
    }
  }

  // Marca de agua y pie en todas las páginas
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (logoImg) {
      doc.setGState(new doc.GState({ opacity: 0.08 }));
      const wmWidth = 400; const wmHeight = wmWidth * (logoImg.height / logoImg.width);
      doc.addImage(logoImg, 'JPEG', (pageWidth - wmWidth) / 2, (pageHeight - wmHeight) / 2, wmWidth, wmHeight);
      doc.setGState(new doc.GState({ opacity: 1.0 }));
    }
    doc.setDrawColor(21, 101, 192); doc.setLineWidth(1); doc.line(40, pageHeight - 45, pageWidth - 40, pageHeight - 45);
    doc.setFontSize(8); doc.setTextColor(30, 58, 138);
    doc.text(`Generado: ${new Date().toLocaleString('es-EC')}`, 40, pageHeight - 25);
    doc.text("Control de Flotas - SOMILOR", pageWidth / 2, pageHeight - 25, { align: 'center' });
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 40, pageHeight - 25, { align: 'right' });
  }

  doc.save(`Ficha_Tecnica_${vehiculo.placa || 'Vehiculo'}.pdf`);
};

// ==========================================
// 5. FICHA INDIVIDUAL: ORDEN DE MANTENIMIENTO
// ==========================================
export const generarFichaMantenimientoPDF = async (mantenimiento) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const logoImg = await loadImage(logoUrl);

  if (logoImg) {
    let imgHeight = 65; let imgWidth = imgHeight * (logoImg.width / logoImg.height);
    if (imgWidth > 300) { imgWidth = 300; imgHeight = imgWidth * (logoImg.height / logoImg.width); }
    doc.addImage(logoImg, 'JPEG', 40, 25, imgWidth, imgHeight); 
  } else {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(21, 101, 192); doc.text('SOMILOR S.A.', 40, 60);
  }
  
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(30, 58, 138);
  doc.text("SISTEMA DE GESTIÓN DE FLOTAS", pageWidth - 40, 45, { align: 'right' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
  doc.text(`Fecha Impresión: ${new Date().toLocaleDateString('es-EC')}`, pageWidth - 40, 60, { align: 'right' });

  // CORRECCIÓN: Posición exacta del número de O.T.
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(30, 58, 138);
  doc.text(`O.T. Nº: MANT-${mantenimiento.id}`, pageWidth - 40, 78, { align: 'right' });

  const lineaY = 100;
  doc.setLineWidth(1.5); doc.setDrawColor(21, 101, 192); doc.line(40, lineaY, pageWidth - 40, lineaY);

  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(21, 101, 192); 
  doc.text('ORDEN DE TRABAJO Y MANTENIMIENTO', 40, lineaY + 30);
  doc.setFontSize(12); doc.setTextColor(80, 80, 80);
  doc.text(`Vehículo Asignado: ${mantenimiento.vehiculo?.placa || 'N/A'} - ${mantenimiento.vehiculo?.marca || ''} ${mantenimiento.vehiculo?.modelo || ''}`, 40, lineaY + 48);

  autoTable(doc, { ...estilosFichaMedica, startY: lineaY + 65, head: [crearEncabezadoAzul('1. DETALLES DE LA INTERVENCIÓN')],
    body: [
      ['Tipo de Trabajo', mantenimiento.tipo ? mantenimiento.tipo.toUpperCase() : '-', 'Estado Actual', mantenimiento.estado ? mantenimiento.estado.replace('_',' ').toUpperCase() : '-'],
      ['Procedimiento', { content: mantenimiento.descripcion || '-', colSpan: 3 }],
      ['Fecha Programada', mantenimiento.fecha_programada ? new Date(mantenimiento.fecha_programada).toLocaleDateString('es-EC') : '-', 'Taller Asignado', mantenimiento.taller || 'Taller Central SOMILOR'],
      ['Kilometraje Ref.', mantenimiento.km_programado || '-', 'Costo Presupuestado', mantenimiento.costo ? `$${mantenimiento.costo.toFixed(2)}` : 'Por definir'],
      ['Observaciones', { content: mantenimiento.observaciones || 'Ninguna', colSpan: 3 }]
    ]
  });

  autoTable(doc, { ...estilosFichaMedica, startY: doc.lastAutoTable.finalY + 20, head: [crearEncabezadoAzul('2. INFORME DE TRABAJO (USO EXCLUSIVO DEL TALLER)')],
    body: [
      ['Fecha de Ingreso', '', 'Fecha de Salida', ''],
      ['Costo Real ($)', '', 'Garantía (Meses)', ''],
      ['Repuestos Usados', { content: '\n\n\n\n\n', colSpan: 3 }],
      ['Diagnóstico Final', { content: '\n\n\n\n\n', colSpan: 3 }]
    ]
  });

  const finalY = doc.lastAutoTable.finalY + 60;
  if (finalY < (pageHeight - 60)) {
    doc.setLineWidth(1); doc.setDrawColor(21, 101, 192); 
    doc.line(80, finalY, 240, finalY); doc.setFontSize(9); doc.setTextColor(30, 58, 138); doc.text('Aprobado por (Operaciones)', 160, finalY + 15, { align: 'center' });
    doc.line(pageWidth - 240, finalY, pageWidth - 80, finalY); doc.text('Firma Mecánico Responsable', pageWidth - 160, finalY + 15, { align: 'center' });
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (logoImg) {
      doc.setGState(new doc.GState({ opacity: 0.05 }));
      const wmWidth = 450; const wmHeight = wmWidth * (logoImg.height / logoImg.width);
      doc.addImage(logoImg, 'JPEG', (pageWidth - wmWidth) / 2, (pageHeight - wmHeight) / 2, wmWidth, wmHeight);
      doc.setGState(new doc.GState({ opacity: 1.0 }));
    }
  }

  doc.save(`Orden_Trabajo_MANT_${mantenimiento.id}.pdf`);
};

// ==========================================
// 6. FICHA INDIVIDUAL: RECIBO COMBUSTIBLE
// ==========================================
export const generarFichaCombustiblePDF = async (tanqueo) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const logoImg = await loadImage(logoUrl);

  if (logoImg) {
    let imgHeight = 65; let imgWidth = imgHeight * (logoImg.width / logoImg.height);
    if (imgWidth > 300) { imgWidth = 300; imgHeight = imgWidth * (logoImg.height / logoImg.width); }
    doc.addImage(logoImg, 'JPEG', 40, 25, imgWidth, imgHeight); 
  } else {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(21, 101, 192); doc.text('SOMILOR S.A.', 40, 60);
  }
  
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(30, 58, 138);
  doc.text("SISTEMA DE GESTIÓN DE FLOTAS", pageWidth - 40, 45, { align: 'right' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
  doc.text(`Fecha Impresión: ${new Date().toLocaleDateString('es-EC')}`, pageWidth - 40, 60, { align: 'right' });

  // CORRECCIÓN: Posición exacta del Ticket
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(30, 58, 138);
  doc.text(`TICKET Nº: COMB-${tanqueo.id}`, pageWidth - 40, 78, { align: 'right' });

  const lineaY = 100;
  doc.setLineWidth(1.5); doc.setDrawColor(21, 101, 192); doc.line(40, lineaY, pageWidth - 40, lineaY);

  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(21, 101, 192); 
  doc.text('RECIBO DE ABASTECIMIENTO DE COMBUSTIBLE', 40, lineaY + 30);
  doc.setFontSize(12); doc.setTextColor(80, 80, 80);
  doc.text('Comprobante detallado de consumo interno.', 40, lineaY + 48);

  autoTable(doc, { ...estilosFichaMedica, startY: lineaY + 65, head: [crearEncabezadoAzul('1. DATOS DE LA OPERACIÓN')],
    body: [
      ['Unidad', tanqueo.vehiculo?.placa || '-', 'Marca / Modelo', `${tanqueo.vehiculo?.marca||''} ${tanqueo.vehiculo?.modelo||''}`],
      ['Chofer Asignado', tanqueo.chofer ? `${tanqueo.chofer.nombre} ${tanqueo.chofer.apellido}` : 'No asignado', 'Identificación', tanqueo.chofer?.cedula || '-'],
      ['Fecha y Hora', new Date(tanqueo.fecha).toLocaleString('es-EC'), 'Costo Registrado ($)', `$${(tanqueo.costo_total||0).toFixed(2)}`],
      ['Galones Abastecidos', tanqueo.galones ? `${tanqueo.galones} gal` : '-', 'Observaciones', { content: tanqueo.observaciones || 'Ninguna', colSpan: 3 }]
    ]
  });

  const finalY = doc.lastAutoTable.finalY + 60;
  if (finalY < (pageHeight - 60)) {
    doc.setLineWidth(1); doc.setDrawColor(21, 101, 192); 
    doc.line(80, finalY, 240, finalY); doc.setFontSize(9); doc.setTextColor(30, 58, 138); doc.text('Firma Responsable Autorizado', 160, finalY + 15, { align: 'center' });
    doc.line(pageWidth - 240, finalY, pageWidth - 80, finalY); doc.text('Firma Conductor', pageWidth - 160, finalY + 15, { align: 'center' });
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (logoImg) {
      doc.setGState(new doc.GState({ opacity: 0.05 }));
      const wmWidth = 450; const wmHeight = wmWidth * (logoImg.height / logoImg.width);
      doc.addImage(logoImg, 'JPEG', (pageWidth - wmWidth) / 2, (pageHeight - wmHeight) / 2, wmWidth, wmHeight);
      doc.setGState(new doc.GState({ opacity: 1.0 }));
    }
  }

  doc.save(`Recibo_Combustible_${tanqueo.id}.pdf`);
};