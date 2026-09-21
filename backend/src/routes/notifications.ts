import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { relativeTime } from "../utils/relativeTime.js";

export const notificationsRouter = Router();

// A notification with no userId is a global broadcast; otherwise it's scoped
// to the signed-in user — matches AppNotification.userId being optional.
notificationsRouter.get("/notifications", requireAuth, async (req, res, next) => {
  try {
    const notifications = await prisma.appNotification.findMany({
      where: { OR: [{ userId: req.user!.sub }, { userId: null }] },
      orderBy: { createdAt: "desc" },
    });
    // "time" is derived fresh from createdAt on every read rather than
    // trusting the stored label, which would otherwise go stale.
    const withFreshTime = notifications.map((n) => ({ ...n, time: relativeTime(n.createdAt) }));
    res.json({ success: true, data: { notifications: withFreshTime }, error: null });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.patch("/notifications/:id/read", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.appNotification.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "NOT_FOUND", "Notification not found.");
    const notification = await prisma.appNotification.update({ where: { id }, data: { unread: false } });
    res.json({ success: true, data: { notification }, error: null });
  } catch (err) {
    next(err);
  }
});
