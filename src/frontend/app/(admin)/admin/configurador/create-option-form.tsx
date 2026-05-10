'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@lib/api';
import type { CakeDimension } from '@types-app/index';

const DIMENSIONS: Array<{ value: CakeDimension; label: string }> = [
  { value: 'SIZE', label: 'Tamaño' },
  { value: 'FLAVOR', label: 'Sabor' },
  { value: 'FILLING', label: 'Relleno' },
  { value: 'TOPPING', label: 'Cobertura' },
  { value: 'TOPPER', label: 'Decoración' },
];

interface Props {
  token: string;
}

export function CreateCakeOptionForm({ token }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    dimension: 'SIZE' as CakeDimension,
    priceModifier: '0',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiFetch('/admin/catalog/cake-options', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          dimension: form.dimension,
          priceModifier: Number(form.priceModifier),
        }),
        token,
      });
      setForm({ name: '', dimension: 'SIZE', priceModifier: '0' });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors w-fit"
      >
        + Nueva opción
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-xl p-4 space-y-4"
    >
      <h2 className="font-semibold text-sm">Nueva opción de torta</h2>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">Nombre</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Dimensión</label>
          <select
            value={form.dimension}
            onChange={(e) => setForm({ ...form, dimension: e.target.value as CakeDimension })}
            className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {DIMENSIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Modificador precio (COP)</label>
          <input
            type="number"
            min="0"
            value={form.priceModifier}
            onChange={(e) => setForm({ ...form, priceModifier: e.target.value })}
            className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Crear opción'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
