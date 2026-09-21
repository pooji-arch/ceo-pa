export interface ReportColumn {
  key: string;
  label: string;
}

function cellText(row: Record<string, unknown>, col: ReportColumn): string {
  const v = row[col.key];
  if (v === null || v === undefined) return "";
  return String(v);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportToCsv(filename: string, columns: ReportColumn[], rows: Record<string, unknown>[]) {
  const escapeCsv = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const lines = [
    columns.map((c) => escapeCsv(c.label)).join(","),
    ...rows.map((row) => columns.map((c) => escapeCsv(cellText(row, c))).join(",")),
  ];
  triggerDownload(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }), filename);
}

export async function exportToExcel(filename: string, sheetName: string, columns: ReportColumn[], rows: Record<string, unknown>[]) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31));
  sheet.columns = columns.map((c) => ({ header: c.label, key: c.key, width: Math.max(12, c.label.length + 4) }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => {
    const record: Record<string, string> = {};
    columns.forEach((c) => { record[c.key] = cellText(row, c); });
    sheet.addRow(record);
  });
  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
}

export async function exportToPdf(filename: string, title: string, columns: ReportColumn[], rows: Record<string, unknown>[]) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: columns.length > 6 ? "landscape" : "portrait" });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }), 14, 22);
  autoTable(doc, {
    startY: 27,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => cellText(row, c))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [91, 33, 182] },
  });
  doc.save(filename);
}
