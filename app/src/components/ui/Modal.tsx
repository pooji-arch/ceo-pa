import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-5"
          style={{
            background: "rgba(15,0,40,.5)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 22, rotateX: 6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, rotateX: 0.6, scale: 1 }}
            exit={{ opacity: 0, y: 12, rotateX: 3, scale: 0.96 }}
            transition={{ duration: 0.26, ease: [0.34, 1.56, 0.64, 1] }}
            className="frosted-modal-fixed w-full"
            style={{
              maxWidth: width,
              transformPerspective: 1400,
              background: "var(--glass)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid var(--glass-border)",
              borderRadius: 20,
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b shrink-0"
              style={{ borderColor: "var(--line)" }}
            >
              <h3 className="text-[16px] font-bold font-display" style={{ color: "var(--deep)" }}>
                {title}
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-[var(--surface)]"
                style={{ color: "var(--muted-strong)" }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="frosted-modal-scroll px-6 py-5 flex flex-col gap-4">{children}</div>
            {footer && (
              <div
                className="px-6 py-4 border-t shrink-0 flex justify-end gap-3"
                style={{ borderColor: "var(--line)" }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
