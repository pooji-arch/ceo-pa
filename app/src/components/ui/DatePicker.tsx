import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "../../lib/utils";
import { Label } from "./Field";

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseKey(key: string): Date | null {
  if (!key) return null;
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function buildMonthCells(year: number, monthIndex: number) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startDow = firstOfMonth.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;
  const gridStart = new Date(year, monthIndex, 1 - startDow);
  return Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

const DOW = ["S", "M", "T", "W", "T", "F", "S"];
const TODAY_KEY = toKey(new Date());

/**
 * The app's own themed date picker — a glass popover with a month grid,
 * matching the Weekly Schedule calendar's visual language, in place of the
 * browser's native (unthemeable) date-picker popup.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className,
  invalid,
}: {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = parseKey(value);
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? new Date().getMonth());

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openPicker = () => {
    if (selected) {
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth());
    }
    setOpen((v) => !v);
  };

  const cells = buildMonthCells(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const weeks: Date[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const goMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  return (
    <div ref={rootRef} className={cx("relative", className)}>
      <button
        type="button"
        onClick={openPicker}
        className={cx("glass-input w-full px-3 py-2.5 text-[13.5px] flex items-center gap-2 text-left", invalid && "!border-red-400 !shadow-[0_0_0_3px_rgba(225,29,72,0.14)]")}
      >
        <CalendarDays size={14} className="shrink-0" style={{ color: "var(--brand)" }} />
        <span style={{ color: value ? "var(--deep)" : "var(--muted)" }}>
          {selected ? selected.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : placeholder}
        </span>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 p-3 rounded-[16px]"
          style={{
            width: 260,
            background: "var(--glass)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => goMonth(-1)}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--surface)]"
              style={{ color: "var(--muted-strong)" }}
              aria-label="Previous month"
            >
              <ChevronLeft size={15} />
            </button>
            <div className="text-[12.5px] font-bold font-display" style={{ color: "var(--deep)" }}>{monthLabel}</div>
            <button
              type="button"
              onClick={() => goMonth(1)}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--surface)]"
              style={{ color: "var(--muted-strong)" }}
              aria-label="Next month"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DOW.map((d, i) => (
              <div key={i} className="text-[10px] font-bold text-center" style={{ color: "var(--muted)" }}>{d}</div>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((day) => {
                  const key = toKey(day);
                  const inMonth = day.getMonth() === viewMonth;
                  const isSelected = key === value;
                  const isToday = key === TODAY_KEY;
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => { onChange(key); setOpen(false); }}
                      className="h-7 rounded-full text-[11.5px] font-semibold transition-colors"
                      style={{
                        color: isSelected ? "#fff" : "var(--deep)",
                        background: isSelected ? "var(--brand-grad)" : isToday ? "var(--surface-strong)" : "transparent",
                        opacity: inMonth ? 1 : 0.4,
                      }}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full mt-2 text-[11.5px] font-semibold py-1.5 rounded-lg hover:bg-[var(--surface)]"
              style={{ color: "var(--muted-strong)" }}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function DateField({
  label,
  value,
  onChange,
  placeholder,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <DatePicker value={value} onChange={onChange} placeholder={placeholder} invalid={invalid} />
    </div>
  );
}
