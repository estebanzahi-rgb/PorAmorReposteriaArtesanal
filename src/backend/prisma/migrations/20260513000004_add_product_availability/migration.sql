-- CreateEnum
CREATE TYPE "ProductAvailabilityStatus" AS ENUM ('AVAILABLE', 'OUT_OF_STOCK');

-- AlterTable
ALTER TABLE "products" ADD COLUMN "availabilityStatus" "ProductAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE';
