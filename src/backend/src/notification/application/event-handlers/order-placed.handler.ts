import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SendOrderConfirmationUseCase } from '../../domain/ports/in/send-order-confirmation.use-case';
import { SEND_ORDER_CONFIRMATION_USE_CASE } from '../../notification.tokens';
import { OrderPlacedEvent } from '../../../order/domain/events/order-placed.event';
import { Order } from '../../../order/domain/entities/order.entity';

@Injectable()
export class OrderPlacedHandler {
  private readonly logger = new Logger(OrderPlacedHandler.name);

  constructor(
    @Inject(SEND_ORDER_CONFIRMATION_USE_CASE)
    private readonly sendConfirmation: SendOrderConfirmationUseCase,
  ) {}

  @OnEvent('order.placed')
  async handle(event: OrderPlacedEvent): Promise<void> {
    try {
      await this.sendConfirmation.execute(event.order as Order);
    } catch (err) {
      this.logger.error(
        `Failed to send confirmation for order ${event.orderNumber}: ${(err as Error).message}`,
      );
    }
  }
}
