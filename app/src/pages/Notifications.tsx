import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ErrorBanner } from "../components/ui/AsyncState";
import { cx } from "../lib/utils";
import { useNotifications } from "../hooks/useNotifications";

export default function Notifications() {
  const { notifications, loading, error, refetch, markRead } = useNotifications();

  if (loading) {
    return (
      <Card>
        <div className="px-5 py-8 text-center text-[13px] text-ink-500">Loading notifications...</div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {error && <ErrorBanner message={error} onRetry={refetch} />}
      <Card>
        <div className="divide-y divide-violet-100">
          {notifications.length ? notifications.map((n) => (
            <div key={n.id} className={cx("flex items-start justify-between gap-4 px-5 py-4", n.unread && "bg-violet-50/50")}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-[16px] shrink-0">{n.icon}</div>
                <div>
                  <div className={cx("text-[13px] text-ink-900", n.unread && "font-bold")}>{n.text}</div>
                  <div className="text-[11.5px] text-ink-500 mt-1">{n.time}</div>
                </div>
              </div>
              {n.unread && (
                <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>Mark read</Button>
              )}
            </div>
          )) : <div className="px-5 py-8 text-center text-[13px] text-ink-500">No notifications.</div>}
        </div>
      </Card>
    </div>
  );
}
