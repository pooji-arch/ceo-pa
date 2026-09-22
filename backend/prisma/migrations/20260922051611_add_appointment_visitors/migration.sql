-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "visitors" TEXT[] DEFAULT ARRAY[]::TEXT[];
