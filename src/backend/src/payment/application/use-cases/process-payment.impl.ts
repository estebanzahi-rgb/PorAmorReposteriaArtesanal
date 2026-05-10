import { Inject, Injectable } from '@nestjs/common';
import {
  ProcessPaymentUseCase,
  ProcessPaymentCommand,
  ProcessPaymentResult,
} from '../../domain/ports/in/process-payment.use-case';
import { PAYMENT_GATEWAY } from '../../payment.tokens';
import { PaymentGatewayPort } from '../../domain/ports/out/payment-gateway.port';

@Injectable()
export class ProcessPaymentImpl implements ProcessPaymentUseCase {
  constructor(
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGatewayPort,
  ) {}

  async execute(command: ProcessPaymentCommand): Promise<ProcessPaymentResult> {
    const result = await this.gateway.charge({
      orderId: command.orderId,
      method: command.method,
      amount: command.amount,
    });
    if (!result.success) {
      throw new Error(`Payment failed: ${result.failureReason}`);
    }
    return { transactionId: result.transactionId! };
  }
}
