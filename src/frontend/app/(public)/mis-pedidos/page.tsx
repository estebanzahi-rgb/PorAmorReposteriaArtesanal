import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@lib/auth';
import { serverFetch } from '@lib/api';
import { formatCOP } from '@lib/utils';
import type { OrderDto } from '@types-app/index';

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Recibido',
  IN_PREPARATION: 'En preparación',
  READY: 'Listo',
  SHIPPED: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'bg-blue-100 text-blue-700',
  IN_PREPARATION: 'bg-yellow-100 text-yellow-700',
  READY: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default async function MisPedidosPage() {
  const session = await auth();
  if (!session) redirect('/login');

  let orders: OrderDto[] = [];
  try {
    orders = await serverFetch<OrderDto[]>('/orders', { token: session.backendToken });
  } catch {
    orders = [];
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8 text-[hsl(var(--brand-brown))]">Mis pedidos</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <span className="text-6xl">📦</span>
            <p className="text-xl font-semibold">Aún no tienes pedidos</p>
            <p className="text-muted-foreground">
              Cuando hagas un pedido, aparecerá aquí.
            </p>
            <Link
              href="/catalogo"
              className="inline-block mt-4 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/checkout/confirmacion/${order.id}`}
                className="block bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-mono font-bold text-primary">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-muted text-muted-foreground'}`}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>

                <div className="text-sm text-muted-foreground mb-3">
                  {order.items
                    .slice(0, 2)
                    .map((i) => `${i.productName} ×${i.quantity}`)
                    .join(' · ')}
                  {order.items.length > 2 && ` · +${order.items.length - 2} más`}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {order.deliveryType === 'PICKUP' ? '🏪 Recoger' : '🛵 Domicilio'}
                    {' · '}
                    {order.items.reduce((acc, i) => acc + i.quantity, 0)} productos
                  </span>
                  <span className="font-bold">{formatCOP(order.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
