import { DomainEvent } from '../../../shared/domain/events/domain-event';

export class OrderPlacedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly order: unknown, // evita dependencia circular — se castea en el handler
  ) {
    super();
  }

  get eventName(): string {
    return 'order.placed';
  }
}
