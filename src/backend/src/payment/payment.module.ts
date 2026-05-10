import { Module } from '@nestjs/common';
import { MockPaymentAdapter } from './infrastructure/adapters/mock-payment.adapter';
import { ProcessPaymentImpl } from './application/use-cases/process-payment.impl';
import { PAYMENT_GATEWAY, PROCESS_PAYMENT_USE_CASE } from './payment.tokens';

@Module({
  providers: [
    { provide: PAYMENT_GATEWAY, useClass: MockPaymentAdapter },
    { provide: PROCESS_PAYMENT_USE_CASE, useClass: ProcessPaymentImpl },
  ],
  exports: [PAYMENT_GATEWAY, PROCESS_PAYMENT_USE_CASE],
})
export class PaymentModule {}
