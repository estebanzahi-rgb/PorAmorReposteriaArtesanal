import { Money } from '../../../shared/domain/value-objects/money.vo';
import { OrderPlacedEvent } from '../events/order-placed.event';
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { OrderItem } from './order-item.entity';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'RECEIVED'
  | 'IN_PREPARATION'
  | 'READY'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type DeliveryType = 'PICKUP' | 'DELIVERY';
export type PaymentMethod = 'BANK_TRANSFER' | 'PSE' | 'CARD' | 'MERCADOPAGO';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['RECEIVED', 'CANCELLED'],
  RECEIVED: ['IN_PREPARATION', 'CANCELLED'],
  IN_PREPARATION: ['READY', 'CANCELLED'],
  READY: ['SHIPPED', 'DELIVERED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export interface OrderCreateParams {
  id: string;
  orderNumber: string;
  userId: string;
  deliveryType: DeliveryType;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  subtotal: Money;
  deliveryCost: Money;
  discountAmount: Money;
  couponAmount: Money;
  total: Money;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  deliveryStreet?: string;
  deliveryCity?: string;
  deliveryNotes?: string;
  couponCode?: string;
}

export interface OrderReconstituteParams extends OrderCreateParams {
  status: OrderStatus;
  createdAt: Date;
}

export class Order {
  private _domainEvents: DomainEvent[] = [];

  private constructor(
    public readonly id: string,
    public readonly orderNumber: string,
    public readonly userId: string,
    public status: OrderStatus,
    public readonly deliveryType: DeliveryType,
    public readonly customerName: string,
    public readonly customerPhone: string,
    public readonly customerEmail: string,
    public readonly subtotal: Money,
    public readonly deliveryCost: Money,
    public readonly discountAmount: Money,
    public readonly couponAmount: Money,
    public readonly total: Money,
    public readonly paymentMethod: PaymentMethod,
    public readonly items: OrderItem[],
    public readonly deliveryStreet: string | undefined,
    public readonly deliveryCity: string | undefined,
    public readonly deliveryNotes: string | undefined,
    public readonly couponCode: string | undefined,
    public readonly createdAt: Date,
  ) {}

  static create(params: OrderCreateParams): Order {
    const order = new Order(
      params.id,
      params.orderNumber,
      params.userId,
      'PENDING_PAYMENT',
      params.deliveryType,
      params.customerName,
      params.customerPhone,
      params.customerEmail,
      params.subtotal,
      params.deliveryCost,
      params.discountAmount,
      params.couponAmount,
      params.total,
      params.paymentMethod,
      params.items,
      params.deliveryStreet,
      params.deliveryCity,
      params.deliveryNotes,
      params.couponCode,
      new Date(),
    );
    order.confirmPlacement();
    return order;
  }

  static reconstitute(params: OrderReconstituteParams): Order {
    return new Order(
      params.id,
      params.orderNumber,
      params.userId,
      params.status,
      params.deliveryType,
      params.customerName,
      params.customerPhone,
      params.customerEmail,
      params.subtotal,
      params.deliveryCost,
      params.discountAmount,
      params.couponAmount,
      params.total,
      params.paymentMethod,
      params.items,
      params.deliveryStreet,
      params.deliveryCity,
      params.deliveryNotes,
      params.couponCode,
      params.createdAt,
    );
  }

  transitionTo(newStatus: OrderStatus): void {
    const allowed = VALID_TRANSITIONS[this.status];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid transition from ${this.status} to ${newStatus}`);
    }
    if (newStatus === 'SHIPPED' && this.deliveryType !== 'DELIVERY') {
      throw new Error('SHIPPED is only valid for DELIVERY orders');
    }
    this.status = newStatus;
  }

  confirmPlacement(): void {
    this._domainEvents.push(new OrderPlacedEvent(this.id, this.orderNumber, this));
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}
