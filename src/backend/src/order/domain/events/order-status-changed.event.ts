import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { OrderStatus } from '../entities/order.entity';

export class OrderStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly newStatus: OrderStatus,
    public readonly order: unknown, // evita dependencia circular — se castea en el handler
  ) {
    super();
  }

  get eventName(): string {
    return 'order.status.changed';
  }
}
