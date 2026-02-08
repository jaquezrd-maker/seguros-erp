-- AlterTable
ALTER TABLE "policies" ADD COLUMN     "beneficiary_data" JSONB,
ADD COLUMN     "number_of_installments" INTEGER;
