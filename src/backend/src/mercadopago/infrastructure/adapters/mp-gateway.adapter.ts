import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MercadoPagoConfig, { Preference, Payment } from 'mercadopago';
import {
  MpGatewayPort,
  MpPreferenceParams,
  MpPaymentInfo,
} from '../../domain/ports/out/mp-gateway.port';

@Injectable()
export class MpGatewayAdapter implements MpGatewayPort {
  private readonly client: MercadoPagoConfig;

  constructor(private readonly config: ConfigService) {
    this.client = new MercadoPagoConfig({
      accessToken: config.getOrThrow('MERCADOPAGO_ACCESS_TOKEN'),
    });
  }

  async createPreference(params: MpPreferenceParams): Promise<{ initPoint: string }> {
    const preference = new Preference(this.client);
    const result = await preference.create({
      body: {
        items: params.items.map((i, idx) => ({
          id: String(idx + 1),
          title: i.title,
          quantity: i.quantity,
          unit_price: i.unit_price,
          currency_id: 'COP',
        })),
        payer: { email: params.payerEmail },
        external_reference: params.orderId,
        back_urls: {
          success: this.config.getOrThrow('MERCADOPAGO_SUCCESS_URL'),
          failure: this.config.getOrThrow('MERCADOPAGO_FAILURE_URL'),
          pending: this.config.getOrThrow('MERCADOPAGO_PENDING_URL'),
        },
        auto_return: 'approved',
        notification_url: this.config.getOrThrow('MERCADOPAGO_WEBHOOK_URL'),
      },
    });

    return { initPoint: result.init_point! };
  }

  async getPayment(paymentId: string): Promise<MpPaymentInfo> {
    const payment = new Payment(this.client);
    const result = await payment.get({ id: Number(paymentId) });
    return {
      status: result.status ?? 'unknown',
      externalReference: result.external_reference ?? '',
    };
  }
}
