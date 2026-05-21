import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoUrl from '../assets/SomilorLogo.png'; 

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

  // ==========================================
  // 1. CABECERA ESTRUCTURADA (MÁS AMPLIA)
  // ==========================================
  
  // Bajamos la línea separadora de 85 a 105 para darle una zona exclusiva al logo
  const lineaSeparadoraY = 105; 
  
  if (logoImg) {
    // Aumentamos el tamaño base del logo para que se vea mucho más imponente
    let imgHeight = 65; 
    let imgWidth = imgHeight * (logoImg.width / logoImg.height);
    
    // SEGURO ANTI-SUPERPOSICIÓN: Si el logo es muy rectangular y ancho, 
    // lo limitamos a 220pts de ancho para que NUNCA choque con el texto de la derecha
    if (imgWidth > 220) {
      imgWidth = 220;
      imgHeight = imgWidth * (logoImg.height / logoImg.width);
    }
    
    // Lo dibujamos respetando el margen izquierdo
    doc.addImage(logoImg, 'PNG', 40, 25, imgWidth, imgHeight); 
  } else {
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text("SOMILOR S.A.", 40, 60);
  }

  // Textos de la derecha: Los bajamos un poco para que queden alineados con el nuevo logo grande
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text("SISTEMA DE GESTIÓN DE FLOTAS", pageWidth - 40, 45, { align: 'right' });
  
  doc.setFont(undefined, 'normal');
  doc.text("SOMILOR S.A.", pageWidth - 40, 60, { align: 'right' });
  doc.text(`Emisión: ${new Date().toLocaleString('es-EC')}`, pageWidth - 40, 75, { align: 'right' });

  // Dibujamos la línea separadora más abajo
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.line(40, lineaSeparadoraY, pageWidth - 40, lineaSeparadoraY);

  // ==========================================
  // 2. TÍTULOS DEL REPORTE
  // ==========================================
  
  // Empujamos los títulos 20 puntos más abajo para mantener la limpieza visual
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(titulo, 40, lineaSeparadoraY + 30);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text("Historial completo y detallado de registros operativos.", 40, lineaSeparadoraY + 45);

  const bodyData = datos.map(fila => {
    return columnas.map(col => {
      if (col.render) return col.render(fila);
      return fila[col.dataKey] || '—';
    });
  });

  // ==========================================
  // 3. TABLA Y FOOTER
  // ==========================================
  
  autoTable(doc, {
    startY: lineaSeparadoraY + 65, // <-- Bajamos el inicio de la tabla también
    head: [columnas.map(col => col.header)],
    body: bodyData,
    theme: 'grid', 
    headStyles: { 
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0], 
      lineColor: [200, 200, 200], 
      lineWidth: 1, 
      halign: 'left',
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 9,
      cellPadding: 6,
      textColor: [40, 40, 40],
      lineColor: [200, 200, 200],
      lineWidth: 1
    },
    didDrawPage: function (data) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.line(40, pageHeight - 45, pageWidth - 40, pageHeight - 45);

      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Generado: ${new Date().toLocaleString('es-EC')}`, 40, pageHeight - 25);
      doc.text("Control de Flotas - SOMILOR", pageWidth / 2, pageHeight - 25, { align: 'center' });
      
      const pageCount = doc.internal.getNumberOfPages();
      doc.text(`Página ${data.pageNumber} de ${pageCount}`, pageWidth - 40, pageHeight - 25, { align: 'right' });
    }
  });

  // ==========================================
  // 4. DESCARGA AUTOMÁTICA
  // ==========================================
  
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