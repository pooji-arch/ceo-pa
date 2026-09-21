-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CEO', 'PA');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('Pending', 'Approved', 'Rejected', 'Postponed');

-- CreateEnum
CREATE TYPE "MeetingLinkStatus" AS ENUM ('Pending', 'Scheduled', 'Cancelled');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('New', 'In Progress', 'Completed', 'Postponed', 'Cancelled', 'Blocked');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('Scheduled', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "ActionPointStatus" AS ENUM ('New', 'In Progress', 'Completed');

-- CreateEnum
CREATE TYPE "KaizenStatus" AS ENUM ('New', 'Under Process', 'Hold', 'Completed');

-- CreateEnum
CREATE TYPE "KaizenApproval" AS ENUM ('Hold', 'Approved', 'Not Approved', 'Already in Plan', 'Already there', 'NSI', 'Given idea', 'Check with CEO/DR');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('NA', 'On-time Completion', 'Overdue Completion', 'Hold');

-- CreateEnum
CREATE TYPE "YesNoNA" AS ENUM ('-', 'Yes', 'No', 'NA');

-- CreateEnum
CREATE TYPE "DietStatus" AS ENUM ('Pending', 'In Progress', 'Completed');

-- CreateEnum
CREATE TYPE "OtherTaskStatus" AS ENUM ('New', 'In Progress', 'Completed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "requester" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time" TEXT NOT NULL,
    "priority" "Priority" NOT NULL,
    "approval" "ApprovalStatus" NOT NULL DEFAULT 'Pending',
    "meeting" "MeetingLinkStatus" NOT NULL DEFAULT 'Pending',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorHistoryEntry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "purpose" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,

    CONSTRAINT "VisitorHistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnplannedVisitor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnplannedVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "priority" "Priority" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'New',
    "due" DATE NOT NULL,
    "followup" DATE NOT NULL,
    "remarks" TEXT NOT NULL DEFAULT '',
    "completion" DATE,
    "outcome" TEXT,
    "attachment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "participants" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time" TEXT NOT NULL,
    "agenda" TEXT NOT NULL,
    "status" "MeetingStatus" NOT NULL DEFAULT 'Scheduled',

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionPoint" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "point" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "due" DATE NOT NULL,
    "status" "ActionPointStatus" NOT NULL DEFAULT 'New',

    CONSTRAINT "ActionPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaizenIdea" (
    "id" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "deptCode" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "champion" TEXT NOT NULL,
    "executedBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "impactDept" TEXT NOT NULL DEFAULT '',
    "approval" "KaizenApproval" NOT NULL DEFAULT 'Hold',
    "status" "KaizenStatus" NOT NULL DEFAULT 'New',
    "projectEndDate" DATE,
    "impact" TEXT NOT NULL DEFAULT '',
    "impactTimeline" TEXT NOT NULL DEFAULT '',
    "impactResult" TEXT NOT NULL DEFAULT '-',
    "completionMonth" TEXT NOT NULL DEFAULT '-',
    "scoringStatus" TEXT NOT NULL DEFAULT '-',
    "impactStudy" TEXT NOT NULL DEFAULT '',
    "yesNo" "YesNoNA" NOT NULL DEFAULT '-',
    "addToEffort" "YesNoNA" NOT NULL DEFAULT '-',
    "resultDocLink" TEXT NOT NULL DEFAULT '',
    "progress" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaizenIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "kaizenIdeaId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "startDate" DATE,
    "endDate" DATE,
    "secondEndDate" DATE,
    "completedDate" DATE,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'NA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contributor" (
    "id" TEXT NOT NULL,
    "kaizenIdeaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "idea" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "execution" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ontime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impact" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Contributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyScore" (
    "id" TEXT NOT NULL,
    "monthLabel" TEXT NOT NULL,
    "weekLabel" TEXT NOT NULL,
    "rangeLabel" TEXT NOT NULL,

    CONSTRAINT "WeeklyScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayWork" (
    "id" TEXT NOT NULL,
    "weeklyScoreId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "label" TEXT NOT NULL,
    "hours" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "DayWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayNote" (
    "date" DATE NOT NULL,
    "planned" TEXT NOT NULL DEFAULT '',
    "actuals" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "DayNote_pkey" PRIMARY KEY ("date")
);

-- CreateTable
CREATE TABLE "DietQuery" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "requester" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "followup" DATE NOT NULL,
    "status" "DietStatus" NOT NULL DEFAULT 'Pending',
    "remarks" TEXT NOT NULL DEFAULT '',
    "resolution" TEXT,

    CONSTRAINT "DietQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyActivity" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,

    CONSTRAINT "DailyActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtherTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "due" DATE NOT NULL,
    "status" "OtherTaskStatus" NOT NULL DEFAULT 'New',

    CONSTRAINT "OtherTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "icon" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "unread" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEntry" (
    "id" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "AuditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");

-- CreateIndex
CREATE INDEX "Task_due_idx" ON "Task"("due");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Meeting_date_idx" ON "Meeting"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE INDEX "KaizenIdea_dept_idx" ON "KaizenIdea"("dept");

-- CreateIndex
CREATE INDEX "KaizenIdea_date_idx" ON "KaizenIdea"("date");

-- CreateIndex
CREATE INDEX "KaizenIdea_status_idx" ON "KaizenIdea"("status");

-- CreateIndex
CREATE INDEX "Milestone_kaizenIdeaId_idx" ON "Milestone"("kaizenIdeaId");

-- CreateIndex
CREATE INDEX "Milestone_endDate_idx" ON "Milestone"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Contributor_kaizenIdeaId_name_key" ON "Contributor"("kaizenIdeaId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "DayWork_weeklyScoreId_date_key" ON "DayWork"("weeklyScoreId", "date");

-- CreateIndex
CREATE INDEX "DietQuery_date_idx" ON "DietQuery"("date");

-- CreateIndex
CREATE INDEX "DietQuery_followup_idx" ON "DietQuery"("followup");

-- CreateIndex
CREATE INDEX "DailyActivity_date_idx" ON "DailyActivity"("date");

-- CreateIndex
CREATE INDEX "OtherTask_due_idx" ON "OtherTask"("due");

-- CreateIndex
CREATE INDEX "AppNotification_userId_unread_idx" ON "AppNotification"("userId", "unread");

-- AddForeignKey
ALTER TABLE "ActionPoint" ADD CONSTRAINT "ActionPoint_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_kaizenIdeaId_fkey" FOREIGN KEY ("kaizenIdeaId") REFERENCES "KaizenIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contributor" ADD CONSTRAINT "Contributor_kaizenIdeaId_fkey" FOREIGN KEY ("kaizenIdeaId") REFERENCES "KaizenIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayWork" ADD CONSTRAINT "DayWork_weeklyScoreId_fkey" FOREIGN KEY ("weeklyScoreId") REFERENCES "WeeklyScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppNotification" ADD CONSTRAINT "AppNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
