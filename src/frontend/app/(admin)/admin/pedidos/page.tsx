import { auth } from '@lib/auth';
import { serverFetch } from '@lib/api';
import { formatCOP } from '@lib/utils';
import Link from 'next/link';
import { Suspense } from 'react';
import { OrderSearch } from './order-search';
import type { OrderDto, OrderStatus } from '@types-app/index';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Pendiente de pago',
  RECEIVED: 'Recibido',
  IN_PREPARATION: 'En preparación',
  READY: 'Listo',
  SHIPPED: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
  RECEIVED: 'bg-blue-100 text-blue-700',
  IN_PREPARATION: 'bg-yellow-100 text-yellow-700',
  READY: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

interface Props {
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function AdminPedidosPage({ searchParams }: Props) {
  const { status, q } = await searchParams;
  const session = await auth();

  const queryParts: string[] = [];
  if (status) queryParts.push(`status=${status}`);
  if (q) queryParts.push(`q=${encodeURIComponent(q)}`);
  const query = queryParts.length ? `?${queryParts.join('&')}` : '';
  let orders: OrderDto[] = [];
  try {
    orders = await serverFetch<OrderDto[]>(`/admin/orders${query}`, {
      token: session!.backendToken,
    });
  } catch {
    orders = [];
  }

  const statuses: Array<{ value: string; label: string }> = [
    { value: '', label: 'Todos' },
    { value: 'RECEIVED', label: 'Recibido' },
    { value: 'IN_PREPARATION', label: 'En preparación' },
    { value: 'READY', label: 'Listo' },
    { value: 'SHIPPED', label: 'En camino' },
    { value: 'DELIVERED', label: 'Entregado' },
    { value: 'CANCELLED', label: 'Cancelado' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--brand-brown))]">Pedidos</h1>

      <div className="flex flex-wrap items-center gap-3">
        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <Link
              key={s.value}
              href={s.value ? `/admin/pedidos?status=${s.value}${q ? `&q=${encodeURIComponent(q)}` : ''}` : `/admin/pedidos${q ? `?q=${encodeURIComponent(q)}` : ''}`}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                (status ?? '') === s.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
        <Suspense>
          <OrderSearch />
        </Suspense>
      </div>

      {/* Mobile — cards */}
      <div className="md:hidden space-y-3">
        {orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay pedidos.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono font-semibold text-sm">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[order.status] ?? ''}`}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.deliveryType === 'DELIVERY' ? '🛵 Domicilio' : '🏪 Recogida'}
                  </p>
                </div>
                <p className="font-bold text-base">{formatCOP(order.total)}</p>
              </div>
              <Link
                href={`/admin/pedidos/${order.id}`}
                className="block w-full text-center text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
              >
                Ver pedido →
              </Link>
            </div>
          ))
        )}
      </div>

      {/* Desktop — table */}
      <div className="hidden md:block overflow-x-auto">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pedido</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entrega</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No hay pedidos.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono font-medium">{order.orderNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.deliveryType === 'DELIVERY' ? 'Domicilio' : 'Recogida'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? ''}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCOP(order.total)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                      {new Date(order.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="text-xs px-3 py-1 rounded-md border border-border hover:bg-muted transition-colors"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
