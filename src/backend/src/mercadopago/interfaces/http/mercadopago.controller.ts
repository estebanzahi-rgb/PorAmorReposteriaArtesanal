import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/interfaces/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/interfaces/http/types/authenticated-user';
import {
  CREATE_MP_PREFERENCE_USE_CASE,
  PROCESS_MP_WEBHOOK_USE_CASE,
} from '../../mercadopago.tokens';
import { CreateMpPreferenceUseCase } from '../../domain/ports/in/create-mp-preference.use-case';
import { ProcessMpWebhookUseCase } from '../../domain/ports/in/process-mp-webhook.use-case';

@ApiTags('payments')
@Controller('payments/mercadopago')
export class MercadoPagoController {
  constructor(
    @Inject(CREATE_MP_PREFERENCE_USE_CASE)
    private readonly createPreference: CreateMpPreferenceUseCase,
    @Inject(PROCESS_MP_WEBHOOK_USE_CASE)
    private readonly processWebhook: ProcessMpWebhookUseCase,
    private readonly config: ConfigService,
  ) {}

  @Post('create-preference')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear preferencia de pago en MercadoPago' })
  async createMpPreference(
    @Body() dto: { orderId: string },
    @CurrentUser() _user: AuthenticatedUser,
  ) {
    return this.createPreference.execute({ orderId: dto.orderId });
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recibir notificación de pago de MercadoPago' })
  async handleWebhook(
    @Headers('x-signature') signature: string | undefined,
    @Headers('x-request-id') requestId: string | undefined,
    @Body() body: { type?: string; data?: { id?: string } },
  ) {
    const secret = this.config.get<string>('MERCADOPAGO_WEBHOOK_SECRET');
    const dataId = body?.data?.id;

    if (secret && signature && dataId) {
      this.validateSignature(signature, requestId ?? '', dataId, secret);
    }

    if (body?.type !== 'payment' || !dataId) return { ok: true };

    await this.processWebhook.execute({ paymentId: String(dataId) });
    return { ok: true };
  }

  private validateSignature(
    signature: string,
    requestId: string,
    dataId: string,
    secret: string,
  ): void {
    const parts = Object.fromEntries(signature.split(',').map((p) => p.split('=')));
    const ts = parts['ts'];
    const v1 = parts['v1'];
    if (!ts || !v1) throw new UnauthorizedException('Invalid webhook signature format');
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts}`;
    const computed = createHmac('sha256', secret).update(manifest).digest('hex');
    if (computed !== v1) throw new UnauthorizedException('Invalid webhook signature');
  }
}
