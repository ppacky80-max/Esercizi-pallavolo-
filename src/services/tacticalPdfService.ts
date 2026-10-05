import jsPDF from 'jspdf';
import { TacticalBoardData, TacticalScene, BoardItem } from '../types';

/**
 * Downloads a data URL as an image file (PNG / JPG).
 */
export function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and downloads a multi-page PDF document for a tactical scheme.
 * If multiple phases exist, creates 1 page per phase with title, court render, description and tactical legend.
 */
export async function exportTacticalSchemeToPdf(
  boardData: TacticalBoardData,
  phaseImages: Array<{ phaseName: string; description: string; dataUrl: string }>
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth(); // ~297 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // ~210 mm
  const margin = 14;

  const totalPages = Math.max(1, phaseImages.length);

  for (let idx = 0; idx < totalPages; idx++) {
    if (idx > 0) {
      doc.addPage();
    }

    const currentPhase = phaseImages[idx] || {
      phaseName: 'Schema Generale',
      description: boardData.description || '',
      dataUrl: '',
    };

    // Header bar
    doc.setFillColor(30, 58, 138); // Navy Blue
    doc.rect(margin, margin, pageWidth - margin * 2, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('VOLLEY COACH MANAGER • LAVAGNA TATTICA INTELLIGENTE', margin + 6, margin + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Fase ${idx + 1} di ${totalPages}`, pageWidth - margin - 6, margin + 9.5, { align: 'right' });

    // Title & Metadata
    let y = margin + 20;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    const titleText = (boardData.title || 'Schema Tattico Senza Titolo').toUpperCase();
    doc.text(titleText, margin, y);

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const metaText = `Categoria: ${boardData.category || 'Generale'}   •   Livello: ${boardData.level || 'Intermedio'}   •   Sistema: ${boardData.sistemaDiGioco || '5-1'}   •   Rotazione: R${boardData.rotazione || 1}`;
    doc.text(metaText, margin, y);

    // Phase Title Banner
    y += 5;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, pageWidth - margin * 2, 8, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);
    doc.text(currentPhase.phaseName || `Fase ${idx + 1}`, margin + 4, y + 5.5);

    // Court Image
    y += 12;
    if (currentPhase.dataUrl) {
      try {
        const courtHeight = 110;
        const courtWidth = (courtHeight * 9) / 5; // 9:5 proportion
        const startX = margin + (pageWidth - margin * 2 - courtWidth) / 2;

        doc.setDrawColor(148, 163, 184);
        doc.rect(startX - 0.5, y - 0.5, courtWidth + 1, courtHeight + 1);
        doc.addImage(currentPhase.dataUrl, 'PNG', startX, y, courtWidth, courtHeight);
        y += courtHeight + 6;
      } catch (err) {
        console.warn('PDF image draw error:', err);
      }
    }

    // Phase Description & Legend Row
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    if (currentPhase.description) {
      const descLines = doc.splitTextToSize(`Istruzioni Tattiche: ${currentPhase.description}`, pageWidth - margin * 2);
      doc.text(descLines, margin, y);
      y += descLines.length * 4.5 + 2;
    }

    // Legend
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('LEGENDA:  [P] Palleggiatore  •  [O] Opposto  •  [S1/S2] Schiacciatori  •  [C1/C2] Centrali  •  [L] Libero  •  Frecce = Movimento/Traiettoria', margin, pageHeight - margin - 3);

    // Footer Page Number
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Pagina ${idx + 1} di ${totalPages}`, pageWidth - margin, pageHeight - margin - 3, { align: 'right' });
  }

  const safeTitle = (boardData.title || 'Schema_Tattico').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${safeTitle}.pdf`);
}
