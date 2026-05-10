import { Order, OrderStatus } from '../../entities/order.entity';

export interface UpdateOrderStatusCommand {
  orderId: string;
  newStatus: OrderStatus;
}

export interface UpdateOrderStatusUseCase {
  execute(command: UpdateOrderStatusCommand): Promise<Order>;
}
