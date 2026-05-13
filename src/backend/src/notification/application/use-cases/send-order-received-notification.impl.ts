import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendOrderReceivedNotificationUseCase } from '../../domain/ports/in/send-order-received-notification.use-case';
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
export class SendOrderReceivedNotificationImpl implements SendOrderReceivedNotificationUseCase {
  constructor(
    @Inject(EMAIL_PORT) private readonly emailPort: EmailPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(order: Order): Promise<void> {
    const ownerWhatsapp = this.configService.get<string>('OWNER_WHATSAPP', '');
    const waText = encodeURIComponent(
      `Hola! Quiero consultar sobre mi pedido ${order.orderNumber}. Gracias.`,
    );
    const whatsappLink = `https://wa.me/${ownerWhatsapp}?text=${waText}`;

    const methodLabels: Record<string, string> = {
      PSE: 'PSE',
      CARD: 'Tarjeta de crédito/débito',
      MERCADOPAGO: 'Mercado Pago',
      BANK_TRANSFER: 'Transferencia bancaria (Bancolombia)',
    };

    const deliveryLabels: Record<string, string> = {
      PICKUP: 'Recoger en tienda',
      DELIVERY: 'Domicilio',
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

    const scheduledRow = order.scheduledAt
      ? `<p><strong>Fecha de entrega programada:</strong> ${order.scheduledAt.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</p>`
      : '';

    const html = `
<!DOCTYPE html>
<html lang="es">
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
  <h1 style="color:#8B4513">¡Tu pedido fue recibido! 🎂</h1>
  <p>Hola <strong>${order.customerName}</strong>, hemos recibido tu pedido correctamente.</p>
  <p><strong>Número de pedido:</strong> ${order.orderNumber}</p>
  ${scheduledRow}

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
      ${order.discountAmount.amount > 0 ? `<tr><td colspan="2" style="padding:4px 12px;text-align:right;color:green">Descuento</td><td style="padding:4px 12px;text-align:right;color:green">-${formatCOP(order.discountAmount.amount)}</td></tr>` : ''}
      ${order.couponAmount.amount > 0 ? `<tr><td colspan="2" style="padding:4px 12px;text-align:right;color:green">Cupón (${order.couponCode})</td><td style="padding:4px 12px;text-align:right;color:green">-${formatCOP(order.couponAmount.amount)}</td></tr>` : ''}
      ${order.deliveryCost.amount > 0 ? `<tr><td colspan="2" style="padding:4px 12px;text-align:right">Domicilio</td><td style="padding:4px 12px;text-align:right">${formatCOP(order.deliveryCost.amount)}</td></tr>` : ''}
      <tr style="font-weight:bold;font-size:1.1em">
        <td colspan="2" style="padding:8px 12px;text-align:right">Total</td>
        <td style="padding:8px 12px;text-align:right">${formatCOP(order.total.amount)}</td>
      </tr>
    </tfoot>
  </table>

  <p><strong>Método de entrega:</strong> ${deliveryLabels[order.deliveryType] ?? order.deliveryType}</p>
  <p><strong>Método de pago:</strong> ${methodLabels[order.paymentMethod] ?? order.paymentMethod}</p>
  ${order.deliveryType === 'DELIVERY' && order.deliveryStreet ? `<p><strong>Dirección de entrega:</strong> ${order.deliveryStreet}, ${order.deliveryCity ?? ''}</p>` : ''}

  <p style="color:#666">Te notificaremos cuando tu pedido esté listo. ¡Gracias por confiar en nosotros!</p>

  <div style="margin:24px 0;text-align:center">
    <a href="${whatsappLink}" style="background:#25D366;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
      Consultar por WhatsApp
    </a>
  </div>

  <p style="color:#888;font-size:0.85em">PorAmor Repostería Artesanal — con amor en cada bocado</p>
</body>
</html>`;

    await this.emailPort.send({
      to: order.customerEmail,
      subject: `¡Tu pedido ${order.orderNumber} fue recibido! — PorAmor Repostería`,
      html,
    });
  }
}
