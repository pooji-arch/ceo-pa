import type { ReactNode } from "react";
import { cx } from "../../lib/utils";

export type IconTone =
  | "violet"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "pink"
  | "cyan"
  | "ink";

const GRADIENTS: Record<IconTone, string> = {
  violet: "var(--brand-grad-raised, linear-gradient(150deg,#b39bfb 0%,#7c3aed 55%,#5b21b6 100%))",
  blue: "linear-gradient(150deg,#8ec5fc 0%,#3b82f6 55%,#1d4ed8 100%)",
  green: "linear-gradient(150deg,#8cf5c4 0%,#10b981 55%,#047857 100%)",
  amber: "linear-gradient(150deg,#ffe08a 0%,#f5a623 55%,#c2740c 100%)",
  red: "linear-gradient(150deg,#ffb3ab 0%,#ef4444 55%,#b91c1c 100%)",
  pink: "linear-gradient(150deg,#ffb3d9 0%,#ec4899 55%,#be185d 100%)",
  cyan: "linear-gradient(150deg,#93f3ea 0%,#06b6d4 55%,#0e7490 100%)",
  ink: "linear-gradient(150deg,#8b85a8 0%,#453d63 55%,#2a2444 100%)",
};

const SIZES = {
  sm: { box: 34, font: 15, radius: 10 },
  md: { box: 44, font: 19, radius: 14 },
  lg: { box: 56, font: 24, radius: 16 },
  xl: { box: 68, font: 30, radius: 18 },
};

export function Icon3D({
  tone = "violet",
  size = "md",
  children,
  className,
}: {
  tone?: IconTone;
  size?: keyof typeof SIZES;
  children: ReactNode;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <div
      className={cx("tile-3d shrink-0", className)}
      style={{
        width: s.box,
        height: s.box,
        borderRadius: s.radius,
        background: GRADIENTS[tone],
      }}
    >
      <span
        className="relative z-10 leading-none"
        style={{ fontSize: s.font, filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.25))" }}
      >
        {children}
      </span>
    </div>
  );
}
