-- AlterEnum: Add PENDING_PAYMENT to OrderStatus
ALTER TYPE "OrderStatus" ADD VALUE 'PENDING_PAYMENT';

-- AlterEnum: Add BANK_TRANSFER to PaymentMethod
ALTER TYPE "PaymentMethod" ADD VALUE 'BANK_TRANSFER';

-- AlterTable: Change default status from RECEIVED to PENDING_PAYMENT
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';
