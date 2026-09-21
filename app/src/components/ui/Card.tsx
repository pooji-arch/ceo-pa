import type { ReactNode, CSSProperties } from "react";
import { motion } from "framer-motion";
import { cx } from "../../lib/utils";

export function Card({
  children,
  className,
  hover = false,
  onClick,
  index,
  style: styleProp,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  /** Optional sibling position — staggers this card's mount animation ~40ms per step. */
  index?: number;
  style?: CSSProperties;
}) {
  const style: CSSProperties | undefined =
    index !== undefined || styleProp
      ? { ...(index !== undefined ? { animationDelay: `${index * 40}ms` } : {}), ...styleProp }
      : undefined;

  return (
    <motion.div
      style={style}
      whileHover={
        hover
          ? {
              y: -4,
              boxShadow:
                "0 10px 28px rgba(91,33,182,.20), 0 0 40px 8px rgba(139,92,246,.35)",
            }
          : undefined
      }
      transition={{ duration: 0.15, ease: "easeOut" }}
      onClick={onClick}
      className={cx("frosted-card", className)}
    >
      {children}
    </motion.div>
  );
}

export function CardHead({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 border-b"
      style={{ borderColor: "var(--line)" }}
    >
      <h3 className="text-[14.5px] font-bold font-display" style={{ color: "var(--deep)" }}>
        {title}
      </h3>
      <div className="flex items-center gap-3">
        {hint && (
          <span className="text-[11.5px] font-medium" style={{ color: "var(--muted-strong)" }}>
            {hint}
          </span>
        )}
        {action}
      </div>
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("p-5", className)}>{children}</div>;
}
