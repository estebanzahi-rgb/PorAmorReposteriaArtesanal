import { Injectable } from '@nestjs/common';
import {
  PaymentGatewayPort,
  PaymentIntent,
  PaymentResult,
} from '../../domain/ports/out/payment-gateway.port';

@Injectable()
export class MockPaymentAdapter implements PaymentGatewayPort {
  async charge(intent: PaymentIntent): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return {
      success: true,
      transactionId: `MOCK-${intent.method}-${Date.now()}`,
    };
  }
}
