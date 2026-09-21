import { prisma } from "../config/prisma.js";

// This app only has two real roles (CEO, PA) sharing one notification feed —
// matches the original prototype's single unread list. Events don't map
// cleanly to a specific user (an appointment's "requester" or a task's
// "owner" are free-text, not real accounts), so every notification is
// global (userId: null) rather than targeted at one person.
export async function notify(icon: string, text: string) {
  await prisma.appNotification.create({ data: { icon, text, time: "Just now", unread: true } });
}
