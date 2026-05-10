import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  UpdateOrderStatusUseCase,
  UpdateOrderStatusCommand,
} from '../../domain/ports/in/update-order-status.use-case';
import { ORDER_REPOSITORY } from '../../order.tokens';
import { OrderRepository } from '../../domain/ports/out/order.repository';
import { Order } from '../../domain/entities/order.entity';

@Injectable()
export class UpdateOrderStatusImpl implements UpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
  ) {}

  async execute(command: UpdateOrderStatusCommand): Promise<Order> {
    const order = await this.orderRepo.findById(command.orderId);
    if (!order) throw new NotFoundException(`Order ${command.orderId} not found`);
    order.transitionTo(command.newStatus);
    return this.orderRepo.save(order);
  }
}
