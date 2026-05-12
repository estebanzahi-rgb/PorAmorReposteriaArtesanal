'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@lib/api';
import type { OrderStatus } from '@types-app/index';

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  RECEIVED: ['IN_PREPARATION', 'CANCELLED'],
  IN_PREPARATION: ['READY', 'CANCELLED'],
  READY: ['SHIPPED', 'DELIVERED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  RECEIVED: 'Recibido',
  IN_PREPARATION: 'En preparación',
  READY: 'Listo',
  SHIPPED: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

interface Props {
  orderId: string;
  currentStatus: OrderStatus;
  deliveryType: 'PICKUP' | 'DELIVERY';
  token: string;
}

export function UpdateStatusForm({ orderId, currentStatus, deliveryType, token }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<OrderStatus | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const nextStatuses = (TRANSITIONS[currentStatus] ?? []).filter(
    (s) => !(s === 'SHIPPED' && deliveryType === 'PICKUP'),
  );

  if (nextStatuses.length === 0) return null;

  async function handleUpdate() {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: selected }),
        token,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h2 className="font-semibold text-sm">Actualizar estado</h2>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value as OrderStatus)}
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Seleccionar nuevo estado</option>
          {nextStatuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          onClick={handleUpdate}
          disabled={!selected || saving}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Actualizar'}
        </button>
      </div>
    </div>
  );
}
