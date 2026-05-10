import { IsEnum } from 'class-validator';
import { OrderStatus } from '../../../domain/entities/order.entity';

export class UpdateOrderStatusDto {
  @IsEnum(['RECEIVED', 'IN_PREPARATION', 'READY', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
  status: OrderStatus;
}
