// src/lib/pdf-report.ts
// ─────────────────────────────────────────────────────────────────────────────
// Helper bersama untuk generate PDF laporan ESG — dipakai di beberapa tempat
// (detail partner, ringkasan periode, laporan gabungan) supaya gaya/format
// dokumennya konsisten, tidak ditulis ulang di setiap tombol.
//
// Satuan posisi (x, y) di jsPDF pakai milimeter (unit: "mm"), halaman A4
// ukurannya 210mm x 297mm. Semua fungsi di sini mengembalikan posisi Y
// terakhir yang sudah dipakai, supaya konten berikutnya tahu harus mulai
// dari mana (menghindari tabrakan/tumpang tindih).
// ─────────────────────────────────────────────────────────────────────────────

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

const BRAND_COLOR: [number, number, number] = [122, 92, 58];
const MUTED_COLOR: [number, number, number] = [110, 100, 90];
const DARK_COLOR: [number, number, number] = [30, 30, 30];

export function createReportDoc(title: string, subtitle: string): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  doc.setFontSize(16);
  doc.setTextColor(...BRAND_COLOR);
  doc.text("Rebru — ESG Report", 14, 18);

  doc.setFontSize(11);
  doc.setTextColor(...MUTED_COLOR);
  doc.text(title, 14, 26);

  doc.setFontSize(9);
  doc.text(subtitle, 14, 32);

  doc.setDrawColor(220, 210, 195);
  doc.line(14, 36, 196, 36);

  return doc;
}

export function addSectionTitle(doc: jsPDF, y: number, title: string): number {
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_COLOR);
  doc.text(title, 14, y);
  return y + 6;
}

export function addKpiGrid(
  doc: jsPDF,
  startY: number,
  items: { label: string; value: string }[],
): number {
  let y = startY;
  items.forEach((item, i) => {
    const col = i % 2;
    const x = 14 + col * 90;
    if (col === 0 && i > 0) y += 14;

    doc.setFontSize(8);
    doc.setTextColor(...MUTED_COLOR);
    doc.text(item.label, x, y);

    doc.setFontSize(11);
    doc.setTextColor(...DARK_COLOR);
    const valueLines = doc.splitTextToSize(item.value, 80);
    doc.text(valueLines, x, y + 5);
  });
  return y + 14;
}

export function addTable(
  doc: jsPDF,
  startY: number,
  head: string[],
  body: (string | number)[][],
): number {
  autoTable(doc, {
    startY,
    head: [head],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: BRAND_COLOR },
    margin: { left: 14, right: 14 },
  });
  // jspdf-autotable menempelkan properti ini ke instance doc setelah dipanggil
  return (doc as any).lastAutoTable.finalY + 8;
}

export function addDisclaimer(doc: jsPDF, y: number, text: string) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const finalY = y > pageHeight - 30 ? pageHeight - 20 : y;
  doc.setFontSize(8);
  doc.setTextColor(...MUTED_COLOR);
  const lines = doc.splitTextToSize(text, 182);
  doc.text(lines, 14, finalY);
}

export function downloadReport(doc: jsPDF, filename: string) {
  doc.save(filename);
}
