import { motion } from "framer-motion";

export function ProgressBar({ value, tone = "violet" }: { value: number; tone?: "violet" | "green" | "amber" }) {
  const colors: Record<string, string> = {
    violet: "var(--brand-grad)",
    green: "linear-gradient(90deg, var(--green), var(--green-deep))",
    amber: "linear-gradient(90deg, var(--amber), var(--amber-deep))",
  };
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-strong)" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: colors[tone] }}
      />
    </div>
  );
}
