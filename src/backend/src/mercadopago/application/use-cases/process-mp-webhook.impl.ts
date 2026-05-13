import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ORDER_REPOSITORY } from '../../../order/order.tokens';
import { OrderRepository } from '../../../order/domain/ports/out/order.repository';
import { MP_GATEWAY } from '../../mercadopago.tokens';
import { MpGatewayPort } from '../../domain/ports/out/mp-gateway.port';
import {
  ProcessMpWebhookUseCase,
  ProcessMpWebhookCommand,
} from '../../domain/ports/in/process-mp-webhook.use-case';

@Injectable()
export class ProcessMpWebhookImpl implements ProcessMpWebhookUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    @Inject(MP_GATEWAY) private readonly mpGateway: MpGatewayPort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: ProcessMpWebhookCommand): Promise<void> {
    const payment = await this.mpGateway.getPayment(command.paymentId);
    if (payment.status !== 'approved') return;

    const order = await this.orderRepo.findById(payment.externalReference);
    if (!order || order.status !== 'PENDING_PAYMENT') return;

    order.transitionTo('RECEIVED');
    await this.orderRepo.save(order);

    for (const event of order.pullDomainEvents()) {
      this.eventEmitter.emit(event.eventName, event);
    }
  }
}
