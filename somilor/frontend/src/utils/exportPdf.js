import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoUrl from '../assets/LOGO.jpeg'; 

// ==========================================
// 1. REPORTE GENERAL DE FLOTA / CHOFERES (LISTADOS)
// ==========================================
export const generarPDF = async (titulo, columnas, datos, nombreArchivo) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const loadImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  };

  const logoImg = await loadImage(logoUrl);

  // 1. Cabecera Corporativa (Escala de Azules)
  if (logoImg) {
    let imgHeight = 65; 
    let imgWidth = imgHeight * (logoImg.width / logoImg.height);
    if (imgWidth > 300) {
      imgWidth = 300;
      imgHeight = imgWidth * (logoImg.height / logoImg.width);
    }
    doc.addImage(logoImg, 'JPEG', 40, 25, imgWidth, imgHeight); 
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(21, 101, 192); // Azul Principal
    doc.text("SOMILOR S.A.", 40, 60);
  }

  // Textos de la derecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138); // Azul Marino
  doc.text("SISTEMA DE GESTIÓN DE FLOTAS", pageWidth - 40, 45, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Fecha Impresión: ${new Date().toLocaleDateString('es-EC')}`, pageWidth - 40, 60, { align: 'right' });

  // Línea separadora Azul Principal
  const lineaY = 100;
  doc.setLineWidth(1.5);
  doc.setDrawColor(21, 101, 192); 
  doc.line(40, lineaY, pageWidth - 40, lineaY);

  // 2. Títulos del Reporte
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(21, 101, 192); // Azul Principal
  doc.text(titulo.toUpperCase(), 40, lineaY + 30);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text("Documento general exportado desde el sistema central.", 40, lineaY + 48);

  const bodyData = datos.map(fila => {
    return columnas.map(col => {
      if (col.render) return col.render(fila);
      return fila[col.dataKey] || '—';
    });
  });

  // 3. Tabla Principal
  autoTable(doc, {
    startY: lineaY + 65,
    head: [columnas.map(col => col.header)],
    body: bodyData,
    theme: 'grid', 
    headStyles: { 
      fillColor: [21, 101, 192], // Fondo Azul Principal
      textColor: [255, 255, 255], // Letra Blanca
      lineColor: [160, 190, 220], // Borde Azul Suave
      lineWidth: 0.5, 
      halign: 'left',
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: { 
      fontSize: 9,
      cellPadding: 6,
      textColor: [40, 40, 40],
      lineColor: [160, 190, 220],
      lineWidth: 0.5
    },
    alternateRowStyles: {
      fillColor: [245, 250, 255] // Azul ultra claro para alternar filas
    },
    didDrawPage: function (data) {
      // ==========================================
      // MARCA DE AGUA (FONDO DIFUMINADO)
      // ==========================================
      if (logoImg) {
        doc.setGState(new doc.GState({ opacity: 0.08 })); // 8% de opacidad
        const wmWidth = 400; 
        const wmHeight = wmWidth * (logoImg.height / logoImg.width);
        const wmX = (pageWidth - wmWidth) / 2; 
        const wmY = (pageHeight - wmHeight) / 2; 
        
        doc.addImage(logoImg, 'JPEG', wmX, wmY, wmWidth, wmHeight);
        doc.setGState(new doc.GState({ opacity: 1.0 })); // Restaurar opacidad
      }

      // Footer
      doc.setDrawColor(21, 101, 192); // Línea del footer azul principal
      doc.setLineWidth(1);
      doc.line(40, pageHeight - 45, pageWidth - 40, pageHeight - 45);

      doc.setFontSize(8);
      doc.setTextColor(30, 58, 138);
      doc.text(`Generado: ${new Date().toLocaleString('es-EC')}`, 40, pageHeight - 25);
      doc.text("Control de Flotas - SOMILOR", pageWidth / 2, pageHeight - 25, { align: 'center' });
      
      const pageCount = doc.internal.getNumberOfPages();
      doc.text(`Página ${data.pageNumber} de ${pageCount}`, pageWidth - 40, pageHeight - 25, { align: 'right' });
    }
  });

  // 4. Descarga Automática
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `${nombreArchivo}.pdf`;
  
  document.body.appendChild(enlace);
  enlace.click(); 
  
  setTimeout(() => {
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  }, 100);
};

// ==========================================
// 2. NUEVA FUNCIÓN: FICHA TÉCNICA (ESCALA DE AZULES)
// ==========================================
export const generarFichaVehiculoPDF = async (vehiculo) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const loadImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  };

  const logoImg = await loadImage(logoUrl);

  // 1. Cabecera Corporativa 
  if (logoImg) {
    let imgHeight = 65; 
    let imgWidth = imgHeight * (logoImg.width / logoImg.height);
    if (imgWidth > 300) {
      imgWidth = 300;
      imgHeight = imgWidth * (logoImg.height / logoImg.width);
    }
    doc.addImage(logoImg, 'JPEG', 40, 25, imgWidth, imgHeight); 
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(21, 101, 192); // Azul Principal
    doc.text('SOMILOR S.A.', 40, 60);
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138); // Azul Marino
  doc.text(`PLACA: ${vehiculo.placa || 'N/A'}`, pageWidth - 40, 45, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Fecha Impresión: ${new Date().toLocaleDateString('es-EC')}`, pageWidth - 40, 60, { align: 'right' });

  // Línea separadora Azul Principal
  const lineaY = 100;
  doc.setLineWidth(1.5);
  doc.setDrawColor(21, 101, 192); 
  doc.line(40, lineaY, pageWidth - 40, lineaY);

  // ==========================================
  // TÍTULO COMPUESTO DEL VEHÍCULO
  // ==========================================
  const textoAnio = vehiculo.anio ? `(${vehiculo.anio})` : '';
  const nombreVehiculo = `${vehiculo.marca || ''} ${vehiculo.modelo || ''} ${textoAnio} ${vehiculo.color || ''}`.trim().replace(/\s+/g, ' ').toUpperCase();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(21, 101, 192); // Azul Principal
  doc.text(nombreVehiculo || 'UNIDAD SIN DETALLES', 40, lineaY + 30);

  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text('FICHA TÉCNICA DE EQUIPO / VEHÍCULO', 40, lineaY + 48);

  // ==========================================
  // CONFIGURACIÓN MAESTRA DE ESTILOS (ESCALA DE AZULES)
  // ==========================================
  const estilosTabla = {
    theme: 'grid',
    styles: { 
      fontSize: 9, 
      cellPadding: 6, 
      lineColor: [160, 190, 220], // Bordes azul suave
      lineWidth: 0.5 
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [237, 246, 255], cellWidth: '20%', textColor: [30, 58, 138] }, // Fondo azul claro, letra azul marino
      1: { cellWidth: '30%', textColor: [40, 40, 40], fillColor: [255, 255, 255] }, // Fondo blanco, letra oscura
      2: { fontStyle: 'bold', fillColor: [237, 246, 255], cellWidth: '20%', textColor: [30, 58, 138] }, // Fondo azul claro, letra azul marino
      3: { cellWidth: '30%', textColor: [40, 40, 40], fillColor: [255, 255, 255] }  // Fondo blanco, letra oscura
    },
    margin: { left: 40, right: 40 }
  };

  // Función auxiliar para encabezados de bloque (Fondo Azul Principal, Letra Blanca)
  const crearEncabezado = (titulo) => [
    { content: titulo, colSpan: 4, styles: { halign: 'center', fillColor: [21, 101, 192], textColor: [255, 255, 255], fontSize: 11, fontStyle: 'bold' } }
  ];

  // 2. TABLA 1: DATOS BASE
  autoTable(doc, {
    ...estilosTabla,
    startY: lineaY + 65,
    head: [crearEncabezado('1. DATOS BASE')],
    body: [
      ['Placa Actual', vehiculo.placa || '-', 'Placa Anterior', vehiculo.placa_anterior || '-'],
      ['Marca', vehiculo.marca || '-', 'Modelo', vehiculo.modelo || '-'],
      ['Año Fabricación', vehiculo.anio ? vehiculo.anio.toString() : '-', 'País Origen', vehiculo.pais_origen || '-'],
      ['Color Principal', vehiculo.color || '-', 'Color Secundario', vehiculo.color_secundario || '-'],
      ['Uso Registrado', { content: `${vehiculo.kilometraje_actual || 0} ${vehiculo.tipo === 'maquinaria' ? 'hrs' : 'km'}`, colSpan: 3 }]
    ]
  });

  // 3. TABLA 2: ESPECIFICACIONES TÉCNICAS
  autoTable(doc, {
    ...estilosTabla,
    startY: doc.lastAutoTable.finalY + 15,
    head: [crearEncabezado('2. ESPECIFICACIONES TÉCNICAS')],
    body: [
      ['Tipo de Vehículo', vehiculo.tipo ? vehiculo.tipo.toUpperCase() : '-', 'Clase Vehículo', vehiculo.clase_vehiculo || '-'],
      ['Nro. Especie', vehiculo.numero_especie || '-', 'Carrocería', vehiculo.carroceria || '-'],
      ['Motor', vehiculo.numero_motor || '-', 'Chasis', vehiculo.numero_chasis || '-'],
      ['Combustible', vehiculo.tipo_combustible || '-', 'Pasajeros', vehiculo.capacidad_pasajeros ? vehiculo.capacidad_pasajeros.toString() : '-'],
      ['Cilindraje (cc)', vehiculo.cilindraje ? vehiculo.cilindraje.toString() : '-', 'Tonelaje (t)', vehiculo.tonelaje ? vehiculo.tonelaje.toString() : '-']
    ]
  });

  // 4. TABLA 3: DATOS LEGALES Y DE PROPIEDAD
  autoTable(doc, {
    ...estilosTabla,
    startY: doc.lastAutoTable.finalY + 15,
    head: [crearEncabezado('3. DATOS LEGALES Y DE PROPIEDAD')],
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

  // 5. Firmas
  const finalY = doc.lastAutoTable.finalY + 60;
  if (finalY < (pageHeight - 60)) {
    doc.setLineWidth(1);
    doc.setDrawColor(21, 101, 192); // Línea azul para las firmas
    
    doc.line(80, finalY, 240, finalY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 58, 138);
    doc.text('Firma Responsable', 160, finalY + 15, { align: 'center' });
    
    doc.line(pageWidth - 240, finalY, pageWidth - 80, finalY);
    doc.text('Firma Digitador', pageWidth - 160, finalY + 15, { align: 'center' });
  }

  // ==========================================
  // 6. APLICAR MARCA DE AGUA A TODAS LAS PÁGINAS DE LA FICHA
  // ==========================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (logoImg) {
      doc.setGState(new doc.GState({ opacity: 0.05 })); // 5% Opacidad
      const wmWidth = 450; 
      const wmHeight = wmWidth * (logoImg.height / logoImg.width);
      const wmX = (pageWidth - wmWidth) / 2;
      const wmY = (pageHeight - wmHeight) / 2;
      doc.addImage(logoImg, 'JPEG', wmX, wmY, wmWidth, wmHeight);
      doc.setGState(new doc.GState({ opacity: 1.0 })); // Restaurar opacidad
    }
  }

  // 7. Descarga Automática
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `Ficha_Tecnica_${vehiculo.placa || 'Vehiculo'}.pdf`;
  
  document.body.appendChild(enlace);
  enlace.click(); 
  
  setTimeout(() => {
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  }, 100);
};