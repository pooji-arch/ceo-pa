import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../../lib/utils";

type Variant = "primary" | "ghost" | "outline" | "danger" | "soft";
type Size = "sm" | "md";

const base = "fv-btn select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "fv-btn-primary",
  outline: "fv-btn-glass",
  ghost: "fv-btn-ghost",
  soft: "fv-btn-soft",
  danger: "fv-btn-danger",
};

const sizes: Record<Size, string> = {
  sm: "text-[12px] px-3 py-1.5",
  md: "text-[13px] px-4 py-2.5",
};

export function Button({
  variant = "outline",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cx(base, variants[variant], sizes[size], className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}
