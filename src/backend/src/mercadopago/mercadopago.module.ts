import { Module } from '@nestjs/common';
import { OrderModule } from '../order/order.module';
import { MpGatewayAdapter } from './infrastructure/adapters/mp-gateway.adapter';
import { CreateMpPreferenceImpl } from './application/use-cases/create-mp-preference.impl';
import { ProcessMpWebhookImpl } from './application/use-cases/process-mp-webhook.impl';
import { MercadoPagoController } from './interfaces/http/mercadopago.controller';
import { MP_GATEWAY, CREATE_MP_PREFERENCE_USE_CASE, PROCESS_MP_WEBHOOK_USE_CASE } from './mercadopago.tokens';

@Module({
  imports: [OrderModule],
  controllers: [MercadoPagoController],
  providers: [
    { provide: MP_GATEWAY, useClass: MpGatewayAdapter },
    { provide: CREATE_MP_PREFERENCE_USE_CASE, useClass: CreateMpPreferenceImpl },
    { provide: PROCESS_MP_WEBHOOK_USE_CASE, useClass: ProcessMpWebhookImpl },
  ],
})
export class MercadoPagoPaymentsModule {}
