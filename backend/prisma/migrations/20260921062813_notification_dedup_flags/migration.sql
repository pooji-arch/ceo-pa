-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "notifiedDueAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "notifiedOverdueAt" TIMESTAMP(3);
