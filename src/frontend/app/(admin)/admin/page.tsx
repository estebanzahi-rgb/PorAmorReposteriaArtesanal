import { auth } from '@lib/auth';
import { serverFetch } from '@lib/api';
import { Price } from '@components/ui/price';
import type { OrderDto } from '@types-app/index';

export default async function AdminDashboard() {
  const session = await auth();

  let orders: OrderDto[] = [];
  try {
    orders = await serverFetch<OrderDto[]>('/admin/orders', { token: session!.backendToken });
  } catch {
    orders = [];
  }

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const pendingOrders = orders.filter((o) =>
    ['RECEIVED', 'IN_PREPARATION', 'READY'].includes(o.status),
  );
  const todayRevenue = todayOrders.reduce((acc, o) => acc + o.total, 0);
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);

  const stats = [
    { label: 'Pedidos hoy', value: todayOrders.length, icon: '📦', color: 'text-blue-600', isAmount: false },
    { label: 'Pendientes', value: pendingOrders.length, icon: '⏳', color: 'text-yellow-600', isAmount: false },
    { label: 'Ventas hoy', value: todayRevenue, icon: '💰', color: 'text-green-600', isAmount: true },
    { label: 'Total histórico', value: totalRevenue, icon: '📈', color: 'text-purple-600', isAmount: true },
  ];

  const recentOrders = orders.slice(0, 5);

  const STATUS_LABELS: Record<string, string> = {
    PENDING_PAYMENT: 'Pendiente de pago',
    RECEIVED: 'Recibido',
    IN_PREPARATION: 'En preparación',
    READY: 'Listo',
    SHIPPED: 'En camino',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
  };

  const STATUS_COLORS: Record<string, string> = {
    PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
    RECEIVED: 'bg-blue-100 text-blue-700',
    IN_PREPARATION: 'bg-yellow-100 text-yellow-700',
    READY: 'bg-purple-100 text-purple-700',
    SHIPPED: 'bg-orange-100 text-orange-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--brand-brown))]">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>
              {s.isAmount ? <Price amount={s.value as number} /> : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Pedidos recientes</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay pedidos todavía.</p>
        ) : (
          <div className="divide-y divide-border">
            {recentOrders.map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-mono font-medium">{order.orderNumber}</p>
                  <p className="text-muted-foreground text-xs">{order.customerName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? ''}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <Price amount={order.total} className="font-semibold" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
