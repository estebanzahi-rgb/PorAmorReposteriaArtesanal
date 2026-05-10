import { Inject, Injectable } from '@nestjs/common';
import { GetUserOrdersUseCase } from '../../domain/ports/in/get-user-orders.use-case';
import { ORDER_REPOSITORY } from '../../order.tokens';
import { OrderRepository } from '../../domain/ports/out/order.repository';
import { Order } from '../../domain/entities/order.entity';

@Injectable()
export class GetUserOrdersImpl implements GetUserOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
  ) {}

  async execute(userId: string): Promise<Order[]> {
    return this.orderRepo.findAll({ userId });
  }
}
