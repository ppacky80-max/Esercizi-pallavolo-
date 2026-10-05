import jsPDF from 'jspdf';
import { Esercizio, Allenamento, TacticalBoardData } from '../types';

// Helper to convert base64 / dataUrl or image URL to base64 if needed
async function getBase64ImageFromUrl(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith('data:image')) {
    return imageUrl;
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 600;
      canvas.height = img.naturalHeight || 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUrl);
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch {
        resolve(imageUrl);
      }
    };
    img.onerror = () => reject(new Error('Impossibile caricare immagine'));
    img.src = imageUrl;
  });
}

// 1. PDF Singolo Esercizio
export async function generaPdfSingoloEsercizio(ex: Esercizio) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Header Bar with Brand
  doc.setFillColor(30, 58, 138); // Navy blue
  doc.rect(margin, y, contentWidth, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('VOLLEY COACH MANAGER', margin + 6, y + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('SCHEDA TECNICA ESERCIZIO', margin + contentWidth - 6, y + 10.5, { align: 'right' });
  y += 22;

  // Exercise Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(ex.titolo.toUpperCase(), contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 4;

  // Metadata Grid Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 22, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CATEGORIA', margin + 5, y + 6);
  doc.text('DURATA', margin + 50, y + 6);
  doc.text('DIFFICOLTÀ', margin + 90, y + 6);
  doc.text('GIOCATORI', margin + 135, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(ex.categoria, margin + 5, y + 15);
  doc.text(`${ex.durata} minuti`, margin + 50, y + 15);
  doc.text(ex.difficolta, margin + 90, y + 15);
  doc.text(`${ex.minPlayers} - ${ex.maxPlayers} atleti`, margin + 135, y + 15);

  y += 28;

  // Materiale (if present)
  if (ex.materiale && ex.materiale.trim()) {
    checkPageBreak(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);
    doc.text('MATERIALE NECESSARIO', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const matLines = doc.splitTextToSize(ex.materiale, contentWidth);
    doc.text(matLines, margin, y);
    y += matLines.length * 5 + 6;
  }

  // Obiettivo
  if (ex.obiettivo && ex.obiettivo.trim()) {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);
    doc.text('OBIETTIVO DIDATTICO / TATTICO', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const objLines = doc.splitTextToSize(ex.obiettivo, contentWidth);
    doc.text(objLines, margin, y);
    y += objLines.length * 5 + 6;
  }

  // Descrizione
  if (ex.descrizione && ex.descrizione.trim()) {
    checkPageBreak(24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);
    doc.text('DESCRIZIONE DELLO SVOLGIMENTO', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const descLines = doc.splitTextToSize(ex.descrizione, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 6;
  }

  // Note
  if (ex.note && ex.note.trim()) {
    checkPageBreak(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(194, 65, 12); // Amber/orange tone for coaching notes
    doc.text('NOTE E ACCORGIMENTI PER IL COACH', margin, y);
    y += 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const noteLines = doc.splitTextToSize(ex.note, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 5 + 6;
    doc.setFont('helvetica', 'normal');
  }

  // Lavagna o Immagine (Versione 5: Sistema, Rotazione, Giocatori e Scene)
  let parsedBoard: TacticalBoardData | null = null;
  if (ex.boardData) {
    try {
      parsedBoard = JSON.parse(ex.boardData) as TacticalBoardData;
    } catch {
      // ignore
    }
  }

  const imgToRender = ex.boardPreviewUrl || ex.imageUrl;
  if (imgToRender || parsedBoard) {
    checkPageBreak(110);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);

    const boardHeader = parsedBoard?.sistemaDiGioco
      ? `LAVAGNA TATTICA – SISTEMA ${parsedBoard.sistemaDiGioco} • ROTAZIONE R${parsedBoard.rotazione || 1} • ${parsedBoard.situazione || 'Tattica'}`
      : 'LAVAGNA TATTICA / SCHEMA GRAFICO';
    doc.text(boardHeader, margin, y);
    y += 5;

    // Lineup details on PDF (Point 25: sistema, rotazione, giocatori)
    if (parsedBoard && parsedBoard.items) {
      const playersOnBoard = parsedBoard.items.filter((it) => it.type === 'player');
      if (playersOnBoard.length > 0) {
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, contentWidth, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const playerLine = playersOnBoard
          .map((p) => `#${p.label || '?'}${p.isLibero ? ' [LIB]' : p.role ? ` [${p.role.substring(0, 3).toUpperCase()}]` : ''} ${p.courtZone || ''}`)
          .join('   •   ');
        doc.text(`GIOCATORI: ${playerLine}`, margin + 3, y + 5);
        y += 9;
      }
    }

    if (imgToRender) {
      try {
        const base64 = await getBase64ImageFromUrl(imgToRender);
        const imgHeight = 85;
        const imgWidth = (imgHeight * 9) / 5; // maintain 9:5 ratio
        const centeredX = margin + (contentWidth - imgWidth) / 2;

        // Draw subtle frame
        doc.setDrawColor(203, 213, 225);
        doc.rect(centeredX - 1, y - 1, imgWidth + 2, imgHeight + 2);
        doc.addImage(base64, 'PNG', centeredX, y, imgWidth, imgHeight);
        y += imgHeight + 8;
      } catch (e) {
        console.warn('Errore rendering immagine nel PDF:', e);
      }
    }

    // Multi-scene export: if multiple scenes exist, render extra page for additional scenes (Point 25)
    if (parsedBoard?.scenes && parsedBoard.scenes.length > 1) {
      for (let sIdx = 1; sIdx < parsedBoard.scenes.length; sIdx++) {
        const sc = parsedBoard.scenes[sIdx];
        doc.addPage();
        y = margin;

        doc.setFillColor(30, 58, 138);
        doc.rect(margin, y, contentWidth, 14, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`SEQUENZA TATTICA – ${sc.name.toUpperCase()} (Durata: ${sc.durationSeconds}s)`, margin + 6, y + 9.5);
        y += 20;

        if (sc.description) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);
          doc.text(`Descrizione: ${sc.description}`, margin, y);
          y += 10;
        }

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, y, contentWidth, 12, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 58, 138);
        doc.text(
          `Sistema: ${parsedBoard.sistemaDiGioco || '5-1'}  •  Rotazione: R${parsedBoard.rotazione || 1}  •  Scena ${sIdx + 1} di ${parsedBoard.scenes.length}`,
          margin + 4,
          y + 8
        );
      }
    }
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `VOLLEY COACH MANAGER • Documento generato per uso tecnico • Pagina ${i} di ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  const filename = `Esercizio_${ex.titolo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}

// 2. PDF Allenamento Completo
export async function generaPdfAllenamentoCompleto(workout: Allenamento) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 15) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Header Banner
  doc.setFillColor(30, 58, 138);
  doc.rect(margin, y, contentWidth, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('VOLLEY COACH MANAGER', margin + 6, y + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('SCHEDA SESSIONE DI ALLENAMENTO', margin + contentWidth - 6, y + 11.5, { align: 'right' });
  y += 24;

  // Workout Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(workout.titolo.toUpperCase(), contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 4;

  // Session Summary Card
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 22, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SQUADRA', margin + 5, y + 6);
  doc.text('DATA', margin + 55, y + 6);
  doc.text('ORARIO', margin + 100, y + 6);
  doc.text('ESERCIZI', margin + 140, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(workout.squadra, margin + 5, y + 15);
  doc.text(workout.data, margin + 55, y + 15);
  doc.text(`${workout.oraInizio} - ${workout.oraFine}`, margin + 100, y + 15);
  doc.text(`${workout.esercizi.length} esercizi`, margin + 140, y + 15);
  y += 28;

  // Main Objective
  if (workout.obiettivo && workout.obiettivo.trim()) {
    checkPageBreak(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);
    doc.text('OBIETTIVO PRINCIPALE DELLA SEDUTA:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    const objLines = doc.splitTextToSize(workout.obiettivo, contentWidth);
    doc.text(objLines, margin, y);
    y += objLines.length * 5 + 6;
  }

  // General Notes
  if (workout.note && workout.note.trim()) {
    checkPageBreak(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text('NOTE GENERALI:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const noteLines = doc.splitTextToSize(workout.note, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4.5 + 6;
    doc.setFont('helvetica', 'normal');
  }

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;

  // Exercises List
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138);
  doc.text('PROGRAMMA ESERCIZI', margin, y);
  y += 7;

  for (let idx = 0; idx < workout.esercizi.length; idx++) {
    const ex = workout.esercizi[idx];
    checkPageBreak(40);

    // Exercise Box Header
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 10, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);
    doc.text(`${idx + 1}. ${ex.titolo.toUpperCase()}`, margin + 4, y + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `${ex.categoria}  •  ${ex.durata} min  •  Difficoltà: ${ex.difficolta}`,
      margin + contentWidth - 4,
      y + 6.5,
      { align: 'right' }
    );
    y += 14;

    // Objective & Material
    if (ex.obiettivo) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Obiettivo: ', margin + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const obLines = doc.splitTextToSize(ex.obiettivo, contentWidth - 25);
      doc.text(obLines, margin + 22, y);
      y += obLines.length * 4.5 + 2;
    }

    if (ex.materiale) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Materiale: ', margin + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const matLines = doc.splitTextToSize(ex.materiale, contentWidth - 25);
      doc.text(matLines, margin + 22, y);
      y += matLines.length * 4.5 + 2;
    }

    // Description
    if (ex.descrizione) {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Svolgimento: ', margin + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const descLines = doc.splitTextToSize(ex.descrizione, contentWidth - 25);
      doc.text(descLines, margin + 22, y);
      y += descLines.length * 4.5 + 3;
    }

    // Notes
    if (ex.note) {
      checkPageBreak(12);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 77, 28);
      const noteLines = doc.splitTextToSize(`Nota: ${ex.note}`, contentWidth - 6);
      doc.text(noteLines, margin + 4, y);
      y += noteLines.length * 4 + 3;
      doc.setFont('helvetica', 'normal');
    }

    // Board / Image (Versione 5: Sistema e Rotazione se presenti)
    let exBoardMeta: TacticalBoardData | null = null;
    if (ex.boardData) {
      try {
        exBoardMeta = JSON.parse(ex.boardData);
      } catch {
        // ignore
      }
    }

    if (exBoardMeta?.sistemaDiGioco || exBoardMeta?.rotazione) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 58, 138);
      doc.text(
        `SCHEMA TATTICO: Sistema ${exBoardMeta.sistemaDiGioco || '5-1'}  •  Rotazione R${exBoardMeta.rotazione || 1}  •  ${exBoardMeta.situazione || 'Tattica'}`,
        margin + 2,
        y
      );
      y += 4;
    }

    const imgUrl = ex.boardPreviewUrl || ex.imageUrl;
    if (imgUrl) {
      checkPageBreak(65);
      try {
        const base64 = await getBase64ImageFromUrl(imgUrl);
        const imgH = 55;
        const imgW = (imgH * 9) / 5;
        const imgX = margin + (contentWidth - imgW) / 2;
        doc.setDrawColor(226, 232, 240);
        doc.rect(imgX - 1, y - 1, imgW + 2, imgH + 2);
        doc.addImage(base64, 'PNG', imgX, y, imgW, imgH);
        y += imgH + 6;
      } catch (err) {
        console.warn('Errore aggiunta immagine esercizio in PDF allenamento:', err);
      }
    }

    y += 4;
  }

  // Total Duration & Summary Box
  checkPageBreak(25);
  const totalPlannedMinutes = workout.esercizi.reduce((sum, ex) => sum + (Number(ex.durata) || 0), 0);
  
  // Calculate available time
  let availableMinutes = 0;
  try {
    const [startH, startM] = workout.oraInizio.split(':').map(Number);
    const [endH, endM] = workout.oraFine.split(':').map(Number);
    availableMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  } catch {
    availableMinutes = totalPlannedMinutes;
  }
  const remainingMinutes = availableMinutes - totalPlannedMinutes;

  doc.setFillColor(30, 58, 138);
  doc.rect(margin, y, contentWidth, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(
    `DURATA PROGRAMMATA: ${totalPlannedMinutes} min   |   TEMPO DISPONIBILE: ${availableMinutes} min   |   DIFFERENZA: ${remainingMinutes >= 0 ? `+${remainingMinutes}` : remainingMinutes} min`,
    margin + 6,
    y + 9
  );

  // Footer for all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `VOLLEY COACH MANAGER • Scheda Allenamento • Pagina ${i} di ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  const filename = `Allenamento_${workout.squadra.replace(/[^a-zA-Z0-9]/g, '_')}_${workout.data}.pdf`;
  doc.save(filename);
}
