import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "./Card";
import { Icon3D, type IconTone } from "./Icon3D";

// Light, two-colour "mixed" tints for the top stat row — distinct from the
// plain frosted-glass background every other card uses, so these four read
// as a highlighted summary strip at a glance.
const TONE_BG: Partial<Record<IconTone, string>> = {
  blue: "linear-gradient(135deg, rgba(79,124,240,.16) 0%, rgba(139,92,246,.10) 100%)",
  red: "linear-gradient(135deg, rgba(225,29,72,.14) 0%, rgba(245,158,11,.09) 100%)",
  green: "linear-gradient(135deg, rgba(16,185,129,.16) 0%, rgba(6,182,212,.10) 100%)",
  amber: "linear-gradient(135deg, rgba(245,158,11,.18) 0%, rgba(236,72,153,.08) 100%)",
};

export function StatCard({
  tone,
  icon,
  label,
  value,
  sub,
  trend,
  index,
}: {
  tone: IconTone;
  icon: ReactNode;
  label: string;
  value: string | number;
  sub: string;
  trend?: "up" | "down";
  /** Optional sibling position — staggers this tile's mount animation ~40ms per step. */
  index?: number;
}) {
  return (
    <Card hover index={index} className="p-5 relative overflow-hidden" style={{ background: TONE_BG[tone] }}>
      <div
        aria-hidden
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none"
        style={{ background: "rgba(255,255,255,0.35)" }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <div
            className="text-[11.5px] font-bold uppercase tracking-wide"
            style={{ color: "var(--muted-strong)" }}
          >
            {label}
          </div>
          <div
            className="text-[30px] font-extrabold font-display mt-1.5"
            style={{ color: "var(--deep)", fontVariantNumeric: "tabular-nums" }}
          >
            {value}
          </div>
          <div
            className="text-[12px] mt-1.5 font-semibold flex items-center gap-1"
            style={{
              color:
                trend === "up"
                  ? "var(--green-deep)"
                  : trend === "down"
                    ? "var(--red-deep)"
                    : "var(--muted)",
            }}
          >
            {trend === "up" && <TrendingUp size={13} />}
            {trend === "down" && <TrendingDown size={13} />}
            {sub}
          </div>
        </div>
        <Icon3D tone={tone} size="lg">{icon}</Icon3D>
      </div>
    </Card>
  );
}
