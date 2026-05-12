import { auth } from '@lib/auth';
import { serverFetch } from '@lib/api';
import { formatCOP } from '@lib/utils';
import Link from 'next/link';
import type { OrderDto, OrderStatus } from '@types-app/index';
import { UpdateStatusForm } from './update-status-form';

const STATUS_LABELS: Record<OrderStatus, string> = {
  RECEIVED: 'Recibido',
  IN_PREPARATION: 'En preparación',
  READY: 'Listo',
  SHIPPED: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  RECEIVED: 'bg-blue-100 text-blue-700',
  IN_PREPARATION: 'bg-yellow-100 text-yellow-700',
  READY: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PedidoDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const order = await serverFetch<OrderDto>(`/admin/orders/${id}`, {
    token: session!.backendToken,
  }).catch(() => null);

  if (!order) {
    return (
      <div className="text-muted-foreground text-sm">
        Pedido no encontrado.{' '}
        <Link href="/admin/pedidos" className="underline">
          Volver a pedidos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/pedidos" className="text-sm text-muted-foreground hover:underline">
          ← Pedidos
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-mono font-medium">{order.orderNumber}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? ''}`}
        >
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer info */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h2 className="font-semibold text-sm">Cliente</h2>
          <p className="text-sm">{order.customerName}</p>
          <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
          <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
        </div>

        {/* Delivery info */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h2 className="font-semibold text-sm">Entrega</h2>
          <p className="text-sm font-medium">
            {order.deliveryType === 'DELIVERY' ? 'Domicilio' : 'Recogida en tienda'}
          </p>
          {order.deliveryStreet && (
            <p className="text-sm text-muted-foreground">
              {order.deliveryStreet}, {order.deliveryCity}
            </p>
          )}
          {order.deliveryNotes && (
            <p className="text-sm text-muted-foreground italic">{order.deliveryNotes}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Pago: {order.paymentMethod}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Productos</h2>
        <div className="divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{item.productName}</p>
                {item.variantName && (
                  <p className="text-xs text-muted-foreground">{item.variantName}</p>
                )}
                {item.cakeConfig && Object.keys(item.cakeConfig).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {Object.entries(item.cakeConfig)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ')}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCOP(item.subtotal)}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} × {formatCOP(item.unitPrice)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-border pt-3 mt-2 space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCOP(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Descuento</span>
              <span>−{formatCOP(order.discountAmount)}</span>
            </div>
          )}
          {order.couponAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Cupón {order.couponCode && `(${order.couponCode})`}</span>
              <span>−{formatCOP(order.couponAmount)}</span>
            </div>
          )}
          {order.deliveryCost > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Domicilio</span>
              <span>{formatCOP(order.deliveryCost)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-base pt-1 border-t border-border">
            <span>Total</span>
            <span>{formatCOP(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Update status */}
      <UpdateStatusForm orderId={order.id} currentStatus={order.status} deliveryType={order.deliveryType} token={session!.backendToken} />
    </div>
  );
}
