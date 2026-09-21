import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { exportToCsv, exportToExcel, exportToPdf, type ReportColumn } from "../../lib/exportUtils";

export interface ReportDef {
  title: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  loading: boolean;
}

function slug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function ReportViewerModal({ report, onClose }: { report: ReportDef | null; onClose: () => void }) {
  const [exporting, setExporting] = useState<string | null>(null);

  if (!report) return null;
  const { title, columns, rows, loading } = report;
  const filenameBase = slug(title);

  const handleExport = async (kind: "csv" | "excel" | "pdf") => {
    setExporting(kind);
    try {
      if (kind === "csv") exportToCsv(`${filenameBase}.csv`, columns, rows);
      else if (kind === "excel") await exportToExcel(`${filenameBase}.xlsx`, title, columns, rows);
      else await exportToPdf(`${filenameBase}.pdf`, title, columns, rows);
    } finally {
      setExporting(null);
    }
  };

  return (
    <Modal
      open={!!report}
      onClose={onClose}
      title={title}
      width={Math.min(1040, 160 + columns.length * 130)}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="outline" icon={<Download size={14} />} disabled={!!exporting || loading} onClick={() => handleExport("csv")}>
            {exporting === "csv" ? "Exporting..." : "CSV"}
          </Button>
          <Button variant="outline" icon={<FileSpreadsheet size={14} />} disabled={!!exporting || loading} onClick={() => handleExport("excel")}>
            {exporting === "excel" ? "Exporting..." : "Excel"}
          </Button>
          <Button variant="outline" icon={<FileText size={14} />} disabled={!!exporting || loading} onClick={() => handleExport("pdf")}>
            {exporting === "pdf" ? "Exporting..." : "PDF"}
          </Button>
        </>
      }
    >
      <div className="overflow-x-auto max-h-[55vh] overflow-y-auto">
        <table className="tbl">
          <thead>
            <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="tbl-empty">Loading...</td></tr>
            ) : rows.length ? rows.map((row, i) => (
              <tr key={i} className="row-hover">
                {columns.map((c) => <td key={c.key}>{String(row[c.key] ?? "—")}</td>)}
              </tr>
            )) : (
              <tr><td colSpan={columns.length} className="tbl-empty">No data yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-[11px] text-ink-400 mt-3">{rows.length} row{rows.length === 1 ? "" : "s"}</div>
    </Modal>
  );
}
