-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "concept" VARCHAR(255),
ADD COLUMN     "reminder_days" INTEGER DEFAULT 7,
ADD COLUMN     "reminder_sent" BOOLEAN NOT NULL DEFAULT false;
