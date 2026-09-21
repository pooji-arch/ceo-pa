import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, X, Pin, PinOff } from "lucide-react";
import { NAV_GROUPS } from "./navConfig";
import { useStore } from "../../store/store";
import { cx } from "../../lib/utils";

/**
 * Frosted Violet sidebar (spec §4).
 *
 * The collapsed-rail -> hover-expand behaviour is pure CSS: whether the
 * shell (AppShell) carries the `.is-collapsed` class is the only bit of
 * state involved (owned by AppShell, passed down as `pinned`) — when
 * pinned, `.is-collapsed` is left off entirely and the rail just stays
 * expanded; when unpinned, `.is-collapsed .fv-sidebar:hover` in
 * src/frosted.css handles the actual hover-expand with no JS involved.
 * The other bit of state this component needs is the mobile drawer's
 * open/closed flag, also owned by AppShell (CSS can't open/close an
 * overlay in response to a tap on a different element).
 */
export function Sidebar({
  mobileOpen,
  onCloseMobile,
  pinned,
  onTogglePin,
  unreadCount,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  pinned: boolean;
  onTogglePin: () => void;
  unreadCount: number;
}) {
  const role = useStore((s) => s.role);
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();
  const unread = unreadCount;

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((it) => !(it.paOnly && role !== "PA")),
  })).filter((group) => group.items.length > 0);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const renderNav = (showPinToggle: boolean) => (
    <>
      <div className="fv-brand">
        <div className="fv-brand-mark">PA</div>
        <div className="fv-brand-text">
          <div className="fv-brand-title">CEO (PA) APP</div>
          <div className="fv-brand-sub">v2.0 · {role}</div>
        </div>
      </div>

      <nav className="fv-nav-list" aria-label="Primary">
        {visibleGroups.map((group) => (
          <div className="fv-nav-group" key={group.label}>
            <div className="fv-group-label">{group.label}</div>
            <div className="fv-group-items">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.key}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={({ isActive }) => cx("fv-nav-item", isActive && "active")}
                  >
                    <Icon className="fv-icon" strokeWidth={2.1} />
                    <span className="fv-label">{item.label}</span>
                    {item.key === "notifications" && unread > 0 && (
                      <span className="fv-badge">{unread}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="fv-sidebar-footer">
        {showPinToggle && (
          <button onClick={onTogglePin} className="fv-nav-item" title={pinned ? "Unpin sidebar" : "Pin sidebar open"}>
            {pinned ? <PinOff className="fv-icon" strokeWidth={2.1} /> : <Pin className="fv-icon" strokeWidth={2.1} />}
            <span className="fv-label">{pinned ? "Unpin" : "Pin open"}</span>
          </button>
        )}
        <button onClick={handleLogout} className="fv-nav-item fv-signout-btn" title="Sign out">
          <LogOut className="fv-icon" strokeWidth={2.1} />
          <span className="fv-label">Sign out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: floating glass rail — pinned = always expanded, unpinned = collapsed rail that hover-expands (pure CSS) */}
      <aside className="fv-sidebar">{renderNav(true)}</aside>

      {/* Mobile: full glass drawer, toggled from the topbar's menu button */}
      {mobileOpen && <div className="fv-drawer-backdrop" onClick={onCloseMobile} />}
      <aside className={cx("fv-mobile-drawer", mobileOpen && "is-open")} aria-hidden={!mobileOpen}>
        <button className="fv-drawer-close" onClick={onCloseMobile} aria-label="Close menu">
          <X size={16} />
        </button>
        {renderNav(false)}
      </aside>
    </>
  );
}
