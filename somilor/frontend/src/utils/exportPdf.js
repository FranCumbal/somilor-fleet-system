import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <-- Cambio clave 1: Lo importamos como función

export const generarPDF = (titulo, columnas, datos, nombreArchivo) => {
  // Configuración base (Vertical, puntos, tamaño A4)
  const doc = new jsPDF('p', 'pt', 'a4');

  // 1. Título e Identidad Visual SOMILOR
  doc.setFontSize(16);
  doc.setTextColor(200, 168, 75); // Dorado SOMILOR
  doc.text("SOMILOR S.A. - Operaciones Mineras", 40, 40);

  // 2. Subtítulo del Reporte
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text(titulo, 40, 60);
  
  // 3. Fecha de Generación
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generado el: ${new Date().toLocaleString('es-EC')}`, 40, 75);

  // 4. Mapeo de datos para que coincidan con las columnas
  const bodyData = datos.map(fila => {
    return columnas.map(col => {
      // Si la columna tiene una función de renderizado personalizada, la usamos
      if (col.render) return col.render(fila);
      // Caso contrario, tomamos la propiedad directa
      return fila[col.dataKey] || '—';
    });
  });

  // 5. Dibujar la Tabla
  // <-- Cambio clave 2: Llamamos a la función autoTable pasándole el 'doc'
  autoTable(doc, {
    startY: 85,
    head: [columnas.map(col => col.header)],
    body: bodyData,
    theme: 'striped',
    headStyles: { 
      fillColor: [22, 27, 38], // Azul oscuro del panel (var(--panel))
      textColor: [200, 168, 75], // Letras doradas
      halign: 'left'
    },
    styles: { 
      fontSize: 9,
      cellPadding: 6
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  // 6. Descargar el archivo
  doc.save(`${nombreArchivo}.pdf`);
};