import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useStore } from "../../store/store";
import { useNotifications } from "../../hooks/useNotifications";
import { cx } from "../../lib/utils";

export function AppShell() {
  const role = useStore((s) => s.role);
  const [mobileOpen, setMobileOpen] = useState(false);
  // `.is-collapsed` is the pure-CSS switch behind the sidebar's rail ->
  // hover-expand behaviour (see src/frosted.css). Whether it's applied at
  // all is the one bit of real state: pinned = always expanded, unpinned =
  // collapsed rail that hover-expands.
  const [pinned, setPinned] = useState(true);
  const location = useLocation();
  // Fetched once here rather than separately in Sidebar and Topbar, so the
  // unread badge shown in both places comes from a single live count.
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter((n) => n.unread).length;

  if (!role) return <Navigate to="/" replace />;

  return (
    <div className={cx("fv-shell", !pinned && "is-collapsed")}>
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        pinned={pinned}
        onTogglePin={() => setPinned((p) => !p)}
        unreadCount={unreadCount}
      />

      <div className="fv-content-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} unreadCount={unreadCount} />
        <main className="fv-content-scroll">
          <div className="fv-content-inner">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
