-- HU-01: Add scheduledAt to orders for scheduled delivery/pickup
ALTER TABLE "orders" ADD COLUMN "scheduledAt" TIMESTAMP(3);
