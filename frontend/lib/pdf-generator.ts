import jsPDF from "jspdf";

interface RecetaPDF {
  folio: string;
  fecha: string;
  pacienteNombre: string;
  doctorNombre: string;
  diagnostico: string;
  indicacionesGenerales?: string;
  medicamentos: Array<{
    nombreMedicamento: string;
    presentacion?: string;
    concentracion?: string;
    cantidad: number;
    dosis: string;
    frecuencia: string;
    duracionDias: number;
    indicaciones?: string;
  }>;
  firmaDigital?: string;
}

export const generarRecetaPDF = (receta: RecetaPDF): jsPDF => {
  const doc = new jsPDF();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("RECETA MÉDICA", 105, yPos, { align: "center" });
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Folio: ${receta.folio}`, 105, yPos, { align: "center" });
  
  yPos += 15;
  
  // Datos del paciente y doctor
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Paciente:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(receta.pacienteNombre, 50, yPos);
  
  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Fecha:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(receta.fecha).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }), 50, yPos);
  
  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Médico:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(receta.doctorNombre, 50, yPos);
  
  yPos += 12;
  
  // Diagnóstico
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Diagnóstico:", 20, yPos);
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const diagnosticoLines = doc.splitTextToSize(receta.diagnostico, 170);
  doc.text(diagnosticoLines, 20, yPos);
  yPos += diagnosticoLines.length * 5 + 10;
  
  // Medicamentos
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Medicamentos Prescritos:", 20, yPos);
  yPos += 10;
  
  receta.medicamentos.forEach((med, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}. ${med.nombreMedicamento}`, 25, yPos);
    yPos += 6;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    if (med.presentacion || med.concentracion) {
      doc.text(`   Presentación: ${med.presentacion || ""} ${med.concentracion || ""}`, 25, yPos);
      yPos += 5;
    }
    
    doc.text(`   Dosis: ${med.dosis} - ${med.frecuencia}`, 25, yPos);
    yPos += 5;
    
    doc.text(`   Duración: ${med.duracionDias} días - Cantidad: ${med.cantidad}`, 25, yPos);
    yPos += 5;
    
    if (med.indicaciones) {
      const indicacionesLines = doc.splitTextToSize(`   ${med.indicaciones}`, 165);
      doc.text(indicacionesLines, 25, yPos);
      yPos += indicacionesLines.length * 5;
    }
    
    yPos += 8;
  });
  
  // Indicaciones generales
  if (receta.indicacionesGenerales) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Indicaciones Generales:", 20, yPos);
    yPos += 7;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const indicacionesLines = doc.splitTextToSize(receta.indicacionesGenerales, 170);
    doc.text(indicacionesLines, 20, yPos);
    yPos += indicacionesLines.length * 5 + 10;
  }
  
  // Firma
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  yPos = Math.max(yPos + 20, 240);
  
  doc.setDrawColor(0);
  doc.line(120, yPos, 190, yPos);
  yPos += 5;
  doc.setFontSize(9);
  doc.text("Firma del Médico", 155, yPos, { align: "center" });
  yPos += 5;
  doc.text(receta.doctorNombre, 155, yPos, { align: "center" });
  
  if (receta.firmaDigital) {
    yPos += 7;
    doc.setFontSize(7);
    doc.text(`Firma digital: ${receta.firmaDigital.substring(0, 40)}...`, 155, yPos, { align: "center" });
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    "Este documento es una prescripción médica válida",
    105,
    285,
    { align: "center" }
  );
  
  return doc;
};

interface OrdenPDF {
  folio: string;
  fecha: string;
  pacienteNombre: string;
  doctorNombre: string;
  diagnostico: string;
  esUrgente: boolean;
  estudios: Array<{
    nombre: string;
    codigo: string;
    categoria: string;
    requiereAyuno: boolean;
    tiempoAyunoHoras?: number;
    preparacionEspecial?: string;
  }>;
  indicaciones?: string;
}

export const generarOrdenLaboratorioPDF = (orden: OrdenPDF): jsPDF => {
  const doc = new jsPDF();
  let yPos = 20;
  
  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ORDEN DE LABORATORIO", 105, yPos, { align: "center" });
  
  if (orden.esUrgente) {
    doc.setTextColor(255, 0, 0);
    doc.setFontSize(14);
    yPos += 8;
    doc.text("🚨 URGENTE", 105, yPos, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Folio: ${orden.folio}`, 105, yPos, { align: "center" });
  
  yPos += 15;
  
  // Datos del paciente y doctor
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Paciente:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(orden.pacienteNombre, 50, yPos);
  
  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Fecha:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(orden.fecha).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }), 50, yPos);
  
  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Médico:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(orden.doctorNombre, 50, yPos);
  
  yPos += 12;
  
  // Diagnóstico
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Diagnóstico Presuntivo:", 20, yPos);
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const diagnosticoLines = doc.splitTextToSize(orden.diagnostico, 170);
  doc.text(diagnosticoLines, 20, yPos);
  yPos += diagnosticoLines.length * 5 + 10;
  
  // Estudios solicitados
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Estudios Solicitados:", 20, yPos);
  yPos += 10;
  
  // Agrupar por categoría
  const categorias: { [key: string]: typeof orden.estudios } = {};
  orden.estudios.forEach(est => {
    if (!categorias[est.categoria]) {
      categorias[est.categoria] = [];
    }
    categorias[est.categoria].push(est);
  });
  
  Object.entries(categorias).forEach(([categoria, estudios]) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`• ${categoria}`, 25, yPos);
    yPos += 6;
    
    estudios.forEach(est => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`  - ${est.nombre} (${est.codigo})`, 30, yPos);
      yPos += 5;
      
      if (est.requiereAyuno) {
        doc.setFontSize(9);
        doc.setTextColor(200, 100, 0);
        doc.text(`    ⚠️ Requiere ayuno de ${est.tiempoAyunoHoras} horas`, 30, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;
      }
      
      if (est.preparacionEspecial) {
        doc.setFontSize(9);
        const prepLines = doc.splitTextToSize(`    Preparación: ${est.preparacionEspecial}`, 160);
        doc.text(prepLines, 30, yPos);
        yPos += prepLines.length * 4;
      }
      
      yPos += 3;
    });
    
    yPos += 5;
  });
  
  // Indicaciones
  if (orden.indicaciones) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Indicaciones Especiales:", 20, yPos);
    yPos += 7;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const indicacionesLines = doc.splitTextToSize(orden.indicaciones, 170);
    doc.text(indicacionesLines, 20, yPos);
    yPos += indicacionesLines.length * 5 + 10;
  }
  
  // Firma
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  yPos = Math.max(yPos + 15, 240);
  
  doc.setDrawColor(0);
  doc.line(120, yPos, 190, yPos);
  yPos += 5;
  doc.setFontSize(9);
  doc.text("Firma del Médico", 155, yPos, { align: "center" });
  yPos += 5;
  doc.text(orden.doctorNombre, 155, yPos, { align: "center" });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    "Presentar esta orden en el laboratorio designado",
    105,
    285,
    { align: "center" }
  );
  
  return doc;
};
