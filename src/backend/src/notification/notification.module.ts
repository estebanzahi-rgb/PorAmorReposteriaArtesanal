import { Module } from '@nestjs/common';
import { ResendEmailAdapter } from './infrastructure/adapters/resend-email.adapter';
import { SendOrderConfirmationImpl } from './application/use-cases/send-order-confirmation.impl';
import { OrderPlacedHandler } from './application/event-handlers/order-placed.handler';
import { EMAIL_PORT, SEND_ORDER_CONFIRMATION_USE_CASE } from './notification.tokens';

@Module({
  providers: [
    { provide: EMAIL_PORT, useClass: ResendEmailAdapter },
    { provide: SEND_ORDER_CONFIRMATION_USE_CASE, useClass: SendOrderConfirmationImpl },
    OrderPlacedHandler,
  ],
})
export class NotificationModule {}
