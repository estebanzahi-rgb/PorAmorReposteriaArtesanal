import { Money } from '../../../../shared/domain/value-objects/money.vo';
import { PaymentMethod } from '../../../../order/domain/entities/order.entity';

export interface ProcessPaymentCommand {
  orderId: string;
  method: PaymentMethod;
  amount: Money;
}

export interface ProcessPaymentResult {
  transactionId: string;
}

export interface ProcessPaymentUseCase {
  execute(command: ProcessPaymentCommand): Promise<ProcessPaymentResult>;
}
