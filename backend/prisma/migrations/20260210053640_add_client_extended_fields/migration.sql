-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "birth_date" DATE,
ADD COLUMN     "contact_person" VARCHAR(150),
ADD COLUMN     "contact_position" VARCHAR(100),
ADD COLUMN     "purchasing_manager" VARCHAR(150);
