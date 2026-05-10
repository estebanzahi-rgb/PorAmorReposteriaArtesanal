import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GetOrderUseCase } from '../../domain/ports/in/get-order.use-case';
import { ORDER_REPOSITORY } from '../../order.tokens';
import { OrderRepository } from '../../domain/ports/out/order.repository';
import { Order } from '../../domain/entities/order.entity';

@Injectable()
export class GetOrderImpl implements GetOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
  ) {}

  async execute(id: string, requesterId: string, isAdmin = false): Promise<Order> {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    if (!isAdmin && order.userId !== requesterId) {
      throw new ForbiddenException('Access denied');
    }
    return order;
  }
}
