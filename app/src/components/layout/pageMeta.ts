export const PAGE_META: Record<string, { title: string; sub: string }> = {
  dashboard: { title: "Dashboard", sub: "Today's control center" },
  appointments: { title: "Appointments & Visitors", sub: "Requests, approvals and visitor history" },
  weekly: { title: "Weekly Schedule", sub: "Upcoming-week planning view" },
  meetings: { title: "Meetings", sub: "Coordination and action points" },
  tasks: { title: "Tasks & Follow-ups", sub: "Commitments, owners and due dates" },
  daily: { title: "Daily Completed Activities", sub: "Record of completed CEO activities" },
  kaizen: { title: "Kaizen & Milestones", sub: "Ideas, champions and progress" },
  scoring: { title: "CEO Weekly Scoring", sub: "Enter and review weekly scores" },
  diet: { title: "Diet Queries", sub: "Track diet-related requests to closure" },
  other: { title: "Other CEO Tasks", sub: "Flexible miscellaneous items" },
  reports: { title: "Reports", sub: "Dashboards and exportable reports" },
  notifications: { title: "Notifications", sub: "Reminders and system alerts" },
  admin: { title: "Roles & Audit Log", sub: "Access control and activity history" },
};

export function metaFromPath(pathname: string) {
  const key = pathname.split("/").filter(Boolean)[1] ?? "dashboard";
  return PAGE_META[key] ?? PAGE_META.dashboard;
}
