import { Module } from '@nestjs/common';
import { DiscountDataPrismaRepository } from './infrastructure/persistence/discount-data.prisma.repository';
import { DiscountCalculationServiceImpl } from './application/services/discount-calculation.service.impl';
import { AdminDiscountController } from './interfaces/http/admin-discount.controller';
import { DISCOUNT_DATA_REPOSITORY, DISCOUNT_CALCULATION_SERVICE } from './discount.tokens';

@Module({
  controllers: [AdminDiscountController],
  providers: [
    { provide: DISCOUNT_DATA_REPOSITORY, useClass: DiscountDataPrismaRepository },
    { provide: DISCOUNT_CALCULATION_SERVICE, useClass: DiscountCalculationServiceImpl },
  ],
  exports: [DISCOUNT_CALCULATION_SERVICE, DISCOUNT_DATA_REPOSITORY],
})
export class DiscountModule {}
