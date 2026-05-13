import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ORDER_REPOSITORY } from '../../../order/order.tokens';
import { OrderRepository } from '../../../order/domain/ports/out/order.repository';
import { MP_GATEWAY } from '../../mercadopago.tokens';
import { MpGatewayPort } from '../../domain/ports/out/mp-gateway.port';
import {
  CreateMpPreferenceUseCase,
  CreateMpPreferenceCommand,
  MpPreferenceResult,
} from '../../domain/ports/in/create-mp-preference.use-case';

@Injectable()
export class CreateMpPreferenceImpl implements CreateMpPreferenceUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    @Inject(MP_GATEWAY) private readonly mpGateway: MpGatewayPort,
  ) {}

  async execute(command: CreateMpPreferenceCommand): Promise<MpPreferenceResult> {
    const order = await this.orderRepo.findById(command.orderId);
    if (!order) throw new NotFoundException('Order not found');

    const result = await this.mpGateway.createPreference({
      orderId: order.id,
      items: order.items.map((item) => ({
        title: item.productName + (item.variantName ? ` (${item.variantName})` : ''),
        quantity: item.quantity,
        unit_price: item.unitPrice.amount,
      })),
      payerEmail: order.customerEmail,
    });

    return { initPoint: result.initPoint };
  }
}
