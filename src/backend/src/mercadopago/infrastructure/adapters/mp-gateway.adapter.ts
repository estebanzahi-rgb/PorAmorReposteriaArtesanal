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
  private client: MercadoPagoConfig | null = null;

  constructor(private readonly config: ConfigService) {
    const token = config.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (token) {
      this.client = new MercadoPagoConfig({ accessToken: token });
    }
  }

  private getClient(): MercadoPagoConfig {
    if (!this.client) {
      throw new Error('MercadoPago not configured: MERCADOPAGO_ACCESS_TOKEN is missing');
    }
    return this.client;
  }

  async createPreference(params: MpPreferenceParams): Promise<{ initPoint: string }> {
    const preference = new Preference(this.getClient());
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
          success: this.config.get('MERCADOPAGO_SUCCESS_URL', ''),
          failure: this.config.get('MERCADOPAGO_FAILURE_URL', ''),
          pending: this.config.get('MERCADOPAGO_PENDING_URL', ''),
        },
        auto_return: 'approved',
        notification_url: this.config.get('MERCADOPAGO_WEBHOOK_URL', ''),
      },
    });

    return { initPoint: result.init_point! };
  }

  async getPayment(paymentId: string): Promise<MpPaymentInfo> {
    const payment = new Payment(this.getClient());
    const result = await payment.get({ id: Number(paymentId) });
    return {
      status: result.status ?? 'unknown',
      externalReference: result.external_reference ?? '',
    };
  }
}
