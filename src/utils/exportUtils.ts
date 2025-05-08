import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Type pour les colonnes
export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

// Fonction pour exporter en PDF
export const exportToPDF = (
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  fileName: string,
  title: string,
  subtitle?: string,
  summary?: { label: string; value: string }[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Titre
  doc.setFontSize(16);
  doc.setTextColor(220, 38, 38); // Rouge
  doc.text(title, pageWidth / 2, 15, { align: 'center' });
  
  // Sous-titre
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100); // Gris
    doc.text(subtitle, pageWidth / 2, 22, { align: 'center' });
  }
  
  // Ligne de séparation
  doc.setDrawColor(220, 38, 38); // Rouge
  doc.line(14, 25, pageWidth - 14, 25);
  
  // Résumé des données
  let yPos = 30;
  if (summary && summary.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    
    summary.forEach((item, index) => {
      const xPos = 14 + (index * (pageWidth - 28) / summary.length);
      // Calcul de la position X en fonction de l'index
      
      doc.setFont('helvetica', 'normal');
      doc.text(item.label, xPos, yPos);
      
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, xPos, yPos + 5);
    });
    
    yPos += 15;
  }
  
  // Préparation des données pour le tableau
  const tableColumns = columns.map(col => ({ 
    header: col.header, 
    dataKey: col.key,
    width: col.width,
    styles: { 
      halign: col.align || 'left',
      cellPadding: 2,
      fontSize: 8
    }
  }));
  
  const tableRows = data.map(row => {
    return columns.map(col => {
      // Formater les valeurs numériques
      const value = row[col.key as keyof typeof row];
      if (typeof value === 'number') {
        return value.toLocaleString();
      }
      return value;
    });
  });
  
  // Création du tableau
  // Utilisation de jspdf-autotable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (doc as any).autoTable({
    startY: yPos,
    head: [tableColumns.map(col => col.header)],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [220, 38, 38],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: tableColumns.reduce((styles, col, index) => {
      styles[index] = {
        halign: col.styles.halign,
        cellWidth: col.width
      };
      return styles;
    }, {} as Record<number, { halign: string; cellWidth?: number }>),
    margin: { top: 30, right: 14, bottom: 20, left: 14 },
    didDrawPage: (data: { pageNumber: number }) => {
      // Pied de page
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${data.pageNumber} sur ${pageCount} - Exporté le ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
  });
  
  // Enregistrement du fichier
  doc.save(`${fileName}.pdf`);
};

// Fonction pour exporter en Excel
export const exportToExcel = (
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  fileName: string,
  sheetName: string
) => {
  // Préparation des données
  const excelData = data.map(row => {
    const newRow: Record<string, unknown> = {};
    columns.forEach(col => {
      newRow[col.header] = row[col.key];
    });
    return newRow;
  });
  
  // Création du workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // Ajout de la feuille au workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Conversion en binaire et téléchargement
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  saveAs(blob, `${fileName}.xlsx`);
};

// Fonction pour exporter en CSV
export const exportToCSV = (
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  fileName: string
) => {
  // Préparation des données
  const csvData = data.map(row => {
    const newRow: Record<string, unknown> = {};
    columns.forEach(col => {
      newRow[col.header] = row[col.key];
    });
    return newRow;
  });
  
  // Conversion en CSV
  const ws = XLSX.utils.json_to_sheet(csvData);
  const csv = XLSX.utils.sheet_to_csv(ws);
  
  // Téléchargement
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `${fileName}.csv`);
};
