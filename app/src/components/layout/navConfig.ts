import {
  LayoutDashboard,
  CalendarCheck2,
  CalendarRange,
  Users,
  ListChecks,
  Clock3,
  Sparkles,
  Star,
  Salad,
  Layers,
  BarChart3,
  Bell,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  paOnly?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ key: "dashboard", label: "Dashboard", path: "/app/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Scheduling",
    items: [
      { key: "appointments", label: "Appointments & Visitors", path: "/app/appointments", icon: CalendarCheck2 },
      { key: "weekly", label: "Weekly Schedule", path: "/app/weekly", icon: CalendarRange },
      { key: "meetings", label: "Meetings", path: "/app/meetings", icon: Users },
    ],
  },
  {
    label: "Execution",
    items: [
      { key: "tasks", label: "Tasks & Follow-ups", path: "/app/tasks", icon: ListChecks },
      { key: "daily", label: "Daily Completed Activities", path: "/app/daily", icon: Clock3 },
      { key: "kaizen", label: "Kaizen & Milestones", path: "/app/kaizen", icon: Sparkles },
    ],
  },
  {
    label: "Tracking",
    items: [
      { key: "scoring", label: "CEO Weekly Scoring", path: "/app/scoring", icon: Star },
      { key: "diet", label: "Diet Queries", path: "/app/diet", icon: Salad },
      { key: "other", label: "Other CEO Tasks", path: "/app/other", icon: Layers },
    ],
  },
  {
    label: "Insights",
    items: [
      { key: "reports", label: "Reports", path: "/app/reports", icon: BarChart3 },
      { key: "notifications", label: "Notifications", path: "/app/notifications", icon: Bell },
      { key: "admin", label: "Roles & Audit Log", path: "/app/admin", icon: ShieldCheck, paOnly: true },
    ],
  },
];
