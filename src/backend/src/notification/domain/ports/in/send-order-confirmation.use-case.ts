import { Order } from '../../../../order/domain/entities/order.entity';

export interface SendOrderConfirmationUseCase {
  execute(order: Order): Promise<void>;
}
