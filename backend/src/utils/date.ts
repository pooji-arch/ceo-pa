export function toDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function todayDateOnly(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function isOverdue(due: Date, status: string, notOverdueStatuses: string[]): boolean {
  if (notOverdueStatuses.includes(status)) return false;
  return due.getTime() < todayDateOnly().getTime();
}
