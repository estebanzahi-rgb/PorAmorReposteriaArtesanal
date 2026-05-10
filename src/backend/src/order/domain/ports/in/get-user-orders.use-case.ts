import { Order } from '../../entities/order.entity';

export interface GetUserOrdersUseCase {
  execute(userId: string): Promise<Order[]>;
}
