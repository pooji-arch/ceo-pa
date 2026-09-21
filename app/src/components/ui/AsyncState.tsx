import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-[12.5px] font-medium"
      style={{ background: "rgba(225,29,72,0.1)", color: "#be123c" }}
    >
      <AlertTriangle size={15} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-1.5 font-bold hover:underline shrink-0">
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  );
}

export function LoadingRow({ colSpan, label = "Loading..." }: { colSpan: number; label?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="tbl-empty">
        <span className="inline-flex items-center gap-2">
          <Loader2 size={13} className="animate-spin" /> {label}
        </span>
      </td>
    </tr>
  );
}
