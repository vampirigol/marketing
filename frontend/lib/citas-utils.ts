import { Cita } from '@/types';

export function exportToCSV(citas: Cita[], filename: string = 'citas') {
  const headers = [
    'Fecha',
    'Hora',
    'Paciente',
    'Teléfono',
    'Tipo Consulta',
    'Doctor',
    'Sucursal',
    'Estado',
    'Costo',
    'Abonado',
    'Saldo'
  ];

  const rows = citas.map(cita => [
    new Date(cita.fechaCita).toLocaleDateString('es-MX'),
    cita.horaCita,
    cita.pacienteNombre || '',
    cita.pacienteTelefono || '',
    cita.tipoConsulta,
    cita.medicoAsignado || '',
    cita.sucursalNombre || '',
    cita.estado,
    cita.costoConsulta,
    cita.montoAbonado,
    cita.saldoPendiente
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(citas: Cita[], filename: string = 'citas') {
  const jsonContent = JSON.stringify(citas, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function copyToClipboard(citas: Cita[]): string {
  const text = citas.map(cita => {
    return `${new Date(cita.fechaCita).toLocaleDateString('es-MX')} ${cita.horaCita} - ${cita.pacienteNombre} (${cita.tipoConsulta}) - Dr(a). ${cita.medicoAsignado} - ${cita.sucursalNombre}`;
  }).join('\n');

  navigator.clipboard.writeText(text);
  return text;
}

export function generatePDFContent(citas: Cita[], titulo: string = 'Agenda de Citas'): string {
  // Genera HTML que puede ser convertido a PDF
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${titulo}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        h1 {
          color: #2563eb;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 10px;
        }
        .fecha-grupo {
          margin-top: 20px;
        }
        .fecha-header {
          background: #eff6ff;
          padding: 10px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .cita {
          border-left: 4px solid #2563eb;
          padding: 10px;
          margin-bottom: 10px;
          background: #f9fafb;
        }
        .cita-hora {
          font-weight: bold;
          color: #1e40af;
        }
        .cita-paciente {
          font-size: 16px;
          margin: 5px 0;
        }
        .cita-detalles {
          font-size: 14px;
          color: #6b7280;
        }
        .estado {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 10px;
        }
        .estado-confirmada { background: #d1fae5; color: #065f46; }
        .estado-agendada { background: #dbeafe; color: #1e40af; }
        .estado-pendiente { background: #fed7aa; color: #92400e; }
      </style>
    </head>
    <body>
      <h1>${titulo}</h1>
      <p>Generado el: ${new Date().toLocaleDateString('es-MX', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</p>
      
      ${agruparCitasPorFecha(citas).map(grupo => `
        <div class="fecha-grupo">
          <div class="fecha-header">${grupo.fecha}</div>
          ${grupo.citas.map(cita => `
            <div class="cita">
              <div>
                <span class="cita-hora">${cita.horaCita}</span>
                <span class="estado estado-${cita.estado.toLowerCase()}">${cita.estado}</span>
              </div>
              <div class="cita-paciente">${cita.pacienteNombre}</div>
              <div class="cita-detalles">
                ${cita.tipoConsulta} • Dr(a). ${cita.medicoAsignado} • ${cita.sucursalNombre}
              </div>
              ${cita.saldoPendiente > 0 ? `
                <div class="cita-detalles" style="color: #dc2626;">
                  Saldo pendiente: $${cita.saldoPendiente}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `).join('')}
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
        <p>Total de citas: ${citas.length}</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

function agruparCitasPorFecha(citas: Cita[]): { fecha: string; citas: Cita[] }[] {
  const grupos = new Map<string, Cita[]>();

  citas.forEach(cita => {
    const fechaStr = new Date(cita.fechaCita).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (!grupos.has(fechaStr)) {
      grupos.set(fechaStr, []);
    }
    grupos.get(fechaStr)!.push(cita);
  });

  return Array.from(grupos.entries()).map(([fecha, citas]) => ({
    fecha,
    citas: citas.sort((a, b) => a.horaCita.localeCompare(b.horaCita))
  }));
}

export function printAgenda(citas: Cita[], titulo: string = 'Agenda de Citas') {
  const htmlContent = generatePDFContent(citas, titulo);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

export function useKeyboardShortcuts(callbacks: {
  onNextWeek?: () => void;
  onPrevWeek?: () => void;
  onToday?: () => void;
  onNewCita?: () => void;
  onExport?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Right Arrow: Siguiente semana
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
        e.preventDefault();
        callbacks.onNextWeek?.();
      }
      
      // Ctrl/Cmd + Left Arrow: Semana anterior
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        callbacks.onPrevWeek?.();
      }
      
      // Ctrl/Cmd + H: Hoy
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        callbacks.onToday?.();
      }
      
      // Ctrl/Cmd + N: Nueva cita
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        callbacks.onNewCita?.();
      }
      
      // Ctrl/Cmd + E: Exportar
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        callbacks.onExport?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
}

import { useEffect } from 'react';
