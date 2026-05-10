'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@lib/api';

interface Props {
  currentAmount: number;
  token: string;
}

export function DeliveryRateForm({ currentAmount, token }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(currentAmount));
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      await apiFetch('/delivery-rate', {
        method: 'PUT',
        body: JSON.stringify({ amount: Number(amount) }),
        token,
      });
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Tarifa actualizada correctamente.
        </p>
      )}

      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium">Nueva tarifa (COP)</label>
          <input
            required
            type="number"
            min="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setSuccess(false);
            }}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Actualizar'}
        </button>
      </div>
    </form>
  );
}
