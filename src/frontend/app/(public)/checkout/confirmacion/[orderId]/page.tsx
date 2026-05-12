import { notFound, redirect } from 'next/navigation';
import { auth } from '@lib/auth';
import { serverFetch } from '@lib/api';
import Link from 'next/link';
import { formatCOP } from '@lib/utils';
import type { OrderDto } from '@types-app/index';

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Pendiente de pago',
  RECEIVED: 'Recibido',
  IN_PREPARATION: 'En preparación',
  READY: 'Listo para entrega',
  SHIPPED: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const DELIVERY_LABELS: Record<string, string> = {
  PICKUP: 'Recoger en tienda',
  DELIVERY: 'Domicilio',
};

const PAYMENT_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Transferencia bancaria',
  PSE: 'PSE',
  CARD: 'Tarjeta crédito/débito',
  MERCADOPAGO: 'Mercado Pago',
};

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { orderId } = await params;
  const session = await auth();
  if (!session) redirect('/login');

  let order: OrderDto;
  try {
    order = await serverFetch<OrderDto>(`/orders/${orderId}`, {
      token: session.backendToken,
    });
  } catch {
    notFound();
  }

  const ownerWhatsapp = process.env.NEXT_PUBLIC_OWNER_WHATSAPP ?? '';
  const waText = encodeURIComponent(
    `Hola! Te comparto el comprobante del pedido ${order.orderNumber} en PorAmor Repostería. Total: $${order.total.toLocaleString('es-CO')}. Quedo pendiente de confirmación.`,
  );
  const whatsappLink = `https://wa.me/${ownerWhatsapp}?text=${waText}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Success header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-[hsl(var(--brand-brown))] mb-2">
            ¡Pedido recibido!
          </h1>
          <p className="text-muted-foreground">
            Gracias, <strong>{order.customerName}</strong>. Tu pedido está siendo procesado.
          </p>
          <div className="mt-4 inline-block px-4 py-2 bg-primary/10 text-primary rounded-xl font-mono font-bold text-lg">
            {order.orderNumber}
          </div>
        </div>

        {/* Order details card */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6 mb-6">
          {/* Items */}
          <div>
            <h2 className="font-semibold mb-3">Productos</h2>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.productName}
                    {item.variantName ? ` — ${item.variantName}` : ''} ×{item.quantity}
                  </span>
                  <span>{formatCOP(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-border pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCOP(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuento</span>
                <span>-{formatCOP(order.discountAmount)}</span>
              </div>
            )}
            {order.couponAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Cupón {order.couponCode && `(${order.couponCode})`}</span>
                <span>-{formatCOP(order.couponAmount)}</span>
              </div>
            )}
            {order.deliveryCost > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Domicilio</span>
                <span>{formatCOP(order.deliveryCost)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
              <span>Total</span>
              <span>{formatCOP(order.total)}</span>
            </div>
          </div>

          {/* Order info */}
          <div className="border-t border-border pt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Estado</p>
              <p className="font-medium">{STATUS_LABELS[order.status] ?? order.status}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Entrega</p>
              <p className="font-medium">{DELIVERY_LABELS[order.deliveryType] ?? order.deliveryType}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Pago</p>
              <p className="font-medium">{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Contacto</p>
              <p className="font-medium">{order.customerPhone}</p>
            </div>
            {order.deliveryType === 'DELIVERY' && order.deliveryStreet && (
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs mb-1">Dirección</p>
                <p className="font-medium">
                  {order.deliveryStreet}
                  {order.deliveryCity ? `, ${order.deliveryCity}` : ''}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bank transfer instructions */}
        {order.paymentMethod === 'BANK_TRANSFER' && order.status === 'PENDING_PAYMENT' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏦</span>
              <h2 className="font-bold text-amber-900">Realiza tu pago</h2>
            </div>
            <p className="text-sm text-amber-800">
              Tu pedido quedará confirmado una vez recibamos el comprobante de pago.
            </p>
            <div className="bg-white border border-amber-200 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Banco</span>
                <span className="font-semibold">Bancolombia</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo de cuenta</span>
                <span className="font-semibold">Ahorros</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Número de cuenta</span>
                <span className="font-semibold font-mono">123-456-777</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Llave de transferencia</span>
                <span className="font-semibold font-mono">1036626558</span>
              </div>
              <div className="flex justify-between border-t border-amber-100 pt-2 mt-2">
                <span className="text-muted-foreground">Valor a transferir</span>
                <span className="font-bold text-base text-amber-900">{formatCOP(order.total)}</span>
              </div>
            </div>
            <p className="text-xs text-amber-700">
              En el concepto de la transferencia escribe tu número de pedido: <strong>{order.orderNumber}</strong>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {ownerWhatsapp && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              <span>💬</span>
              {order.status === 'PENDING_PAYMENT' ? 'Enviar comprobante' : 'Contactar por WhatsApp'}
            </a>
          )}
          <Link
            href="/mis-pedidos"
            className="flex-1 text-center py-3 border border-border rounded-xl font-semibold hover:bg-muted transition-colors"
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/catalogo"
            className="flex-1 text-center py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
