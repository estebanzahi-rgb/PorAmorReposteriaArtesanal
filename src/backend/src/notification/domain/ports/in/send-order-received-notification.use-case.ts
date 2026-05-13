import { Order } from '../../../../order/domain/entities/order.entity';

export interface SendOrderReceivedNotificationUseCase {
  execute(order: Order): Promise<void>;
}
