import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SendOrderReceivedNotificationUseCase } from '../../domain/ports/in/send-order-received-notification.use-case';
import { SEND_ORDER_RECEIVED_NOTIFICATION_USE_CASE } from '../../notification.tokens';
import { OrderStatusChangedEvent } from '../../../order/domain/events/order-status-changed.event';
import { Order } from '../../../order/domain/entities/order.entity';

@Injectable()
export class OrderStatusChangedHandler {
  private readonly logger = new Logger(OrderStatusChangedHandler.name);

  constructor(
    @Inject(SEND_ORDER_RECEIVED_NOTIFICATION_USE_CASE)
    private readonly sendNotification: SendOrderReceivedNotificationUseCase,
  ) {}

  @OnEvent('order.status.changed')
  async handle(event: OrderStatusChangedEvent): Promise<void> {
    if (event.newStatus !== 'RECEIVED') return;
    try {
      await this.sendNotification.execute(event.order as Order);
    } catch (err) {
      this.logger.error(
        `Failed to send received notification for ${event.orderNumber}: ${(err as Error).message}`,
      );
    }
  }
}
