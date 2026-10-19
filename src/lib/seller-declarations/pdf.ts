import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Inventory } from "./model";
import { RMP_LOGO } from "./brand";

export function buildDeclarationPdf(content: Inventory, revision: number, images: Record<string, Uint8Array>, draft = false): Uint8Array {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter", compress: true });
  const width = doc.internal.pageSize.getWidth(), height = doc.internal.pageSize.getHeight();
  const margin = 13, bottom = height - 27, usable = width - margin * 2;
  let y = 16;
  const page = () => { doc.addPage(); y = 16; };
  const pair = (es: string, en: string) => [es, en].filter(Boolean).join(" / ");
  function text(value: string, size = 9, bold = false) {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(30, 41, 59);
    const lines: string[] = doc.splitTextToSize(value, usable);
    for (const line of lines) {
      if (y + size * 0.4 > bottom) page();
      doc.text(line, margin, y); y += size * 0.4;
    }
    y += 2;
  }
  doc.setFillColor(0, 0, 0);
  doc.rect(margin, 10, 23, 23, "F");
  doc.addImage(RMP_LOGO, "PNG", margin, 10, 23, 23);
  const headingX = margin + 28;
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("DECLARACIONES DEL VENDEDOR / SELLER DECLARATIONS", headingX, 16);
  doc.setFontSize(9);
  doc.text("INCLUSIONES Y EXCLUSIONES / INCLUSIONS AND EXCLUSIONS", headingX, 22);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  doc.text((draft ? "BORRADOR / DRAFT | " : "") + "Rev. " + revision + " | " + content.date, headingX, 28);
  y = 39;
  text("Propiedad / Property: " + content.address, 10, true);
  if (content.mls) text("MLS: " + content.mls, 8);
  text("Vendedor(es) / Seller(s): " + content.sellers);
  text("Este inventario identifica los artículos expresamente incluidos o excluidos. Las fotografías sirven como referencia; cada artículo se rige por la selección indicada en su fila. Los objetos que aparezcan en las fotografías y no estén identificados en la lista no tienen una selección asignada en este documento.", 8);
  text("This inventory identifies items expressly included or excluded. Photographs provide a reference; each item follows the selection stated in its row. Objects visible in photographs that are not identified in the list have no selection assigned in this document.", 8);
  content.rooms.forEach(room => {
    if (y + 30 > bottom) page();
    y += 2; text(pair(room.es, room.en) || "Habitación sin nombre / Unnamed room", 11, true);
    const photos = content.photos.filter(p => p.roomId === room.id);
    const gap = 5, cellWidth = (usable - gap) / 2;
    for (let start = 0; start < photos.length; start += 2) {
      const row = photos.slice(start, start + 2).map(photo => {
        const bytes = images[photo.id];
        if (!bytes) throw Error("A photograph is unavailable. PDF was not generated.");
        const props = doc.getImageProperties(bytes);
        const scale = Math.min(cellWidth / props.width, 43 / props.height);
        return { photo, bytes, w: props.width * scale, h: props.height * scale };
      });
      const rowHeight = Math.max(...row.map(p => p.h)) + 8;
      if (y + rowHeight + 12 > bottom) page();
      row.forEach((p, index) => {
        const x = margin + index * (cellWidth + gap);
        doc.setFont("helvetica", "bold"); doc.setFontSize(8);
        doc.text("Foto / Photo " + (content.photos.findIndex(photo => photo.id === p.photo.id) + 1), x, y);
        doc.addImage(p.bytes, "JPEG", x, y + 2, p.w, p.h);
      });
      y += rowHeight;
    }
    const items = content.items.filter(i => i.roomId === room.id);
    if (!items.length) return;
    const hasNotes = items.some(i => i.notesEs || i.notesEn);
    autoTable(doc, {
      startY: y, margin: { left: margin, right: margin, top: 16, bottom: 27 },
      head: [["Artículo / Item", "Selección / Selection", "Fotos / Photos", ...(hasNotes ? ["Observaciones / Notes"] : [])]],
      body: items.map(i => [pair(i.es, i.en),
        i.status === "included" ? "Incluido / Included" : i.status === "excluded" ? "Excluido / Excluded" : "Sin seleccionar / Unselected",
        i.photoIds.map(id => content.photos.findIndex(p => p.id === id) + 1).join(", "),
        ...(hasNotes ? [pair(i.notesEs, i.notesEn)] : []),
      ]),
      styles: { font: "helvetica", fontSize: 9, cellPadding: 1.6, overflow: "linebreak", textColor: [30, 41, 59] },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: { 0: { cellWidth: hasNotes ? 77 : usable - 57 }, 1: { cellWidth: 39 }, 2: { cellWidth: 18 } },
      rowPageBreak: "avoid",
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  });
  // Keep acknowledgment and both parties' signature lines together.
  if (y + 53 > bottom) page();
  text("RECONOCIMIENTO Y FIRMAS / ACKNOWLEDGMENT AND SIGNATURES", 9, true);
  text("Las partes reconocen haber revisado las descripciones, fotografías y selecciones de este inventario.", 8);
  text("The parties acknowledge reviewing the descriptions, photographs, and selections in this inventory.", 8);
  const signatureTop = y + 7;
  ["Vendedor(es) / Seller(s)", "Comprador(es) / Buyer(s)"].forEach((label, index) => {
    const x = margin + index * (usable / 2 + 2), lineWidth = usable / 2 - 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setDrawColor(110);
    doc.line(x, signatureTop, x + lineWidth, signatureTop);
    doc.text("Firma(s) / Signature(s): " + label, x, signatureTop + 4);
    doc.line(x, signatureTop + 15, x + lineWidth, signatureTop + 15);
    doc.text("Nombre(s) / Name(s)", x, signatureTop + 19);
    doc.line(x, signatureTop + 28, x + lineWidth, signatureTop + 28);
    doc.text("Fecha / Date", x, signatureTop + 32);
  });
  const count = doc.getNumberOfPages();
  for (let n = 1; n <= count; n++) {
    doc.setPage(n); doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(90);
    const addressLine: string = doc.splitTextToSize(content.address, usable)[0] || "";
    doc.text(addressLine, margin, height - 25);
    doc.setDrawColor(200); doc.line(margin, height - 23, width - margin, height - 23);
    doc.text("Iniciales vendedor(es) / Seller initials: __________", margin, height - 18);
    doc.text("Iniciales comprador(es) / Buyer initials: __________", margin + usable / 2, height - 18);
    const agents = (content.preparedBy ?? []).map(name => name.trim()).filter(Boolean).join(" / ");
    if (agents) {
      const lines: string[] = doc.splitTextToSize("Preparado por / Prepared by: " + agents, usable - 15);
      doc.text(lines, margin, height - 13);
    }
    doc.text(content.date + " | Rev. " + revision + (draft ? " | BORRADOR / DRAFT" : ""), margin, height - 5);
    doc.text(n + " / " + count, width - margin, height - 8, { align: "right" });
  }
  return new Uint8Array(doc.output("arraybuffer"));
}
