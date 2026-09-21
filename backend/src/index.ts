import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { appointmentsRouter } from "./routes/appointments.js";
import { tasksRouter } from "./routes/tasks.js";
import { meetingsRouter } from "./routes/meetings.js";
import { dailyActivitiesRouter } from "./routes/dailyActivities.js";
import { dietRouter } from "./routes/diet.js";
import { otherTasksRouter } from "./routes/otherTasks.js";
import { dayNotesRouter } from "./routes/dayNotes.js";
import { kaizenRouter } from "./routes/kaizen.js";
import { milestonesRouter } from "./routes/milestones.js";
import { kaizenScoringRouter } from "./routes/kaizenScoring.js";
import { weeklyScoresRouter } from "./routes/weeklyScores.js";
import { notificationsRouter } from "./routes/notifications.js";
import { auditLogRouter } from "./routes/auditLog.js";
import { runNotificationChecks } from "./jobs/notifyOverdueAndDue.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

app.use(healthRouter);
app.use(authRouter);
app.use(appointmentsRouter);
app.use(tasksRouter);
app.use(meetingsRouter);
app.use(dailyActivitiesRouter);
app.use(dietRouter);
app.use(otherTasksRouter);
app.use(dayNotesRouter);
app.use(kaizenRouter);
app.use(milestonesRouter);
app.use(kaizenScoringRouter);
app.use(weeklyScoresRouter);
app.use(notificationsRouter);
app.use(auditLogRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`CEO PA backend listening on port ${env.port} (${env.nodeEnv})`);
});

// Overdue-task / milestone-due notifications are time-based, not tied to any
// single request — checked once at startup, then hourly. Each check is
// idempotent (notifiedOverdueAt/notifiedDueAt), so overlapping runs are safe.
const ONE_HOUR_MS = 60 * 60 * 1000;
runNotificationChecks().catch((err) => console.error("Notification check failed:", err));
setInterval(() => {
  runNotificationChecks().catch((err) => console.error("Notification check failed:", err));
}, ONE_HOUR_MS);
