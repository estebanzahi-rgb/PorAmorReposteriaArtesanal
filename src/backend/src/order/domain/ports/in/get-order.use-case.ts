import { Order } from '../../entities/order.entity';

export interface GetOrderUseCase {
  execute(id: string, requesterId: string, isAdmin?: boolean): Promise<Order>;
}
