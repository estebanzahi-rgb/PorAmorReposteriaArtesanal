import { PaymentMethod } from '../../../../order/domain/entities/order.entity';
import { Money } from '../../../../shared/domain/value-objects/money.vo';

export interface PaymentIntent {
  orderId: string;
  method: PaymentMethod;
  amount: Money;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  failureReason?: string;
}

// L — Liskov Substitution: MockPaymentGateway y cualquier gateway real
//     son intercambiables sin afectar al Use Case
export interface PaymentGatewayPort {
  charge(intent: PaymentIntent): Promise<PaymentResult>;
}
