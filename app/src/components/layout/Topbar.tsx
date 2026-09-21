import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Bell } from "lucide-react";
import { metaFromPath } from "./pageMeta";
import { useStore } from "../../store/store";

export function Topbar({ onMenuClick, unreadCount }: { onMenuClick: () => void; unreadCount: number }) {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = metaFromPath(location.pathname);
  const role = useStore((s) => s.role);
  const unread = unreadCount;

  return (
    <div className="fv-topbar">
      <div className="fv-topbar-left">
        <button onClick={onMenuClick} className="fv-topbar-menu-btn" aria-label="Open menu">
          <Menu size={17} />
        </button>
        <div>
          <div className="fv-topbar-title">{meta.title}</div>
          <div className="fv-topbar-sub">{meta.sub}</div>
        </div>
      </div>

      <div className="fv-topbar-right">
        <div className="fv-role-pill">
          <span className="fv-role-dot" />
          {role === "CEO" ? "CEO — View & Approve" : "PA — Full Access"}
        </div>

        <button
          onClick={() => navigate("/app/notifications")}
          className="fv-icon-btn-3d"
          aria-label="Notifications"
        >
          <Bell size={16} />
          {unread > 0 && <span className="fv-notif-dot" />}
        </button>

        <div className="fv-avatar">{role === "CEO" ? "CEO" : "PA"}</div>
      </div>
    </div>
  );
}
