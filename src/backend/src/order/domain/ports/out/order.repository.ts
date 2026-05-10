import { Order, OrderStatus, DeliveryType } from '../../entities/order.entity';

export interface OrderFilter {
  userId?: string;
  status?: OrderStatus;
  deliveryType?: DeliveryType;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface OrderRepository {
  findAll(filter?: OrderFilter): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  save(order: Order): Promise<Order>;
}
