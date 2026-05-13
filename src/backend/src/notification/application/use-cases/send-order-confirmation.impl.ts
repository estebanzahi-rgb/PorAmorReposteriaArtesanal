import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendOrderConfirmationUseCase } from '../../domain/ports/in/send-order-confirmation.use-case';
import { EMAIL_PORT } from '../../notification.tokens';
import { EmailPort } from '../../domain/ports/out/email.port';
import { Order } from '../../../order/domain/entities/order.entity';

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);

@Injectable()
export class SendOrderConfirmationImpl implements SendOrderConfirmationUseCase {
  constructor(
    @Inject(EMAIL_PORT) private readonly emailPort: EmailPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(order: Order): Promise<void> {
    const ownerEmail = this.configService.get<string>('OWNER_EMAIL', '');
    const ownerWhatsapp = this.configService.get<string>('OWNER_WHATSAPP', '');
    const waText = encodeURIComponent(
      `Hola! Realicé el pedido ${order.orderNumber} en PorAmor Repostería. Quedo pendiente de confirmación.`,
    );
    const whatsappLink = `https://wa.me/${ownerWhatsapp}?text=${waText}`;

    const statusLabels: Record<string, string> = {
      PICKUP: 'Recoger en tienda',
      DELIVERY: 'Domicilio',
    };

    const methodLabels: Record<string, string> = {
      PSE: 'PSE',
      CARD: 'Tarjeta de crédito/débito',
      MERCADOPAGO: 'Mercado Pago',
      BANK_TRANSFER: 'Transferencia bancaria (Bancolombia)',
    };

    const itemsHtml = order.items
      .map(
        (item) =>
          `<tr>
            <td style="padding:6px 12px">${item.productName}${item.variantName ? ` — ${item.variantName}` : ''}</td>
            <td style="padding:6px 12px;text-align:center">${item.quantity}</td>
            <td style="padding:6px 12px;text-align:right">${formatCOP(item.subtotal.amount)}</td>
          </tr>`,
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html lang="es">
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
  <h1 style="color:#8B4513">Nuevo pedido recibido — ${order.orderNumber}</h1>
  <p><strong>Cliente:</strong> ${order.customerName}</p>
  <p><strong>Email:</strong> ${order.customerEmail}</p>
  <p><strong>Teléfono:</strong> ${order.customerPhone}</p>

  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <thead>
      <tr style="background:#f5e6d3">
        <th style="padding:8px 12px;text-align:left">Producto</th>
        <th style="padding:8px 12px;text-align:center">Cant.</th>
        <th style="padding:8px 12px;text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      <tr><td colspan="3" style="border-top:1px solid #ddd;padding:4px"></td></tr>
      <tr>
        <td colspan="2" style="padding:4px 12px;text-align:right">Subtotal</td>
        <td style="padding:4px 12px;text-align:right">${formatCOP(order.subtotal.amount)}</td>
      </tr>
      ${order.discountAmount.amount > 0 ? `<tr><td colspan="2" style="padding:4px 12px;text-align:right;color:green">Descuento</td><td style="padding:4px 12px;text-align:right;color:green">-${formatCOP(order.discountAmount.amount)}</td></tr>` : ''}
      ${order.couponAmount.amount > 0 ? `<tr><td colspan="2" style="padding:4px 12px;text-align:right;color:green">Cupón (${order.couponCode})</td><td style="padding:4px 12px;text-align:right;color:green">-${formatCOP(order.couponAmount.amount)}</td></tr>` : ''}
      ${order.deliveryCost.amount > 0 ? `<tr><td colspan="2" style="padding:4px 12px;text-align:right">Domicilio</td><td style="padding:4px 12px;text-align:right">${formatCOP(order.deliveryCost.amount)}</td></tr>` : ''}
      <tr style="font-weight:bold;font-size:1.1em">
        <td colspan="2" style="padding:8px 12px;text-align:right">Total</td>
        <td style="padding:8px 12px;text-align:right">${formatCOP(order.total.amount)}</td>
      </tr>
    </tfoot>
  </table>

  <p><strong>Método de entrega:</strong> ${statusLabels[order.deliveryType] ?? order.deliveryType}</p>
  <p><strong>Método de pago:</strong> ${methodLabels[order.paymentMethod] ?? order.paymentMethod}</p>
  ${order.deliveryType === 'DELIVERY' && order.deliveryStreet ? `<p><strong>Dirección:</strong> ${order.deliveryStreet}, ${order.deliveryCity ?? ''}</p>` : ''}

  <div style="margin:24px 0;text-align:center">
    <a href="${whatsappLink}" style="background:#25D366;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
      Contactar por WhatsApp
    </a>
  </div>

  <p style="color:#888;font-size:0.85em">PorAmor Repostería Artesanal — con amor en cada bocado</p>
</body>
</html>`;

    await this.emailPort.send({
      to: ownerEmail,
      subject: `Nuevo pedido ${order.orderNumber} — ${order.customerName}`,
      html,
    });
  }
}
