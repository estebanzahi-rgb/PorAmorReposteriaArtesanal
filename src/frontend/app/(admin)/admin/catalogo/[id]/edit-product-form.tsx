'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@lib/api';
import { ImageUploader } from '@components/admin/ImageUploader';
import type { ProductDto } from '@types-app/index';

interface Props {
  product: ProductDto;
  token: string;
}

export function EditProductForm({ product, token }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState(product.availabilityStatus);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  const [form, setForm] = useState({
    name: product.name,
    description: product.description,
    basePrice: String(product.basePrice),
    isCake: product.isCake,
    categoryId: product.category?.id ?? '',
    imageUrls: product.images.join('\n'),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await apiFetch(`/admin/catalog/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          basePrice: Number(form.basePrice),
          isCake: form.isCake,
          categoryId: form.categoryId,
          imageUrls: form.imageUrls
            ? form.imageUrls.split('\n').map((s) => s.trim()).filter(Boolean)
            : [],
        }),
        token,
      });
      router.push('/admin/catalogo');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAvailability() {
    setTogglingAvailability(true);
    try {
      const updated = await apiFetch<{ availabilityStatus: string }>(`/admin/catalog/${product.id}/availability`, {
        method: 'PATCH',
        token,
      });
      setAvailabilityStatus(updated.availabilityStatus as typeof availabilityStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar disponibilidad');
    } finally {
      setTogglingAvailability(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium">Nombre</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Descripción</label>
        <textarea
          required
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Precio base (COP)</label>
          <input
            required
            type="number"
            min="1"
            value={form.basePrice}
            onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">ID de categoría</label>
          <input
            required
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">URLs de imágenes (una por línea)</label>
        <textarea
          rows={3}
          value={form.imageUrls}
          onChange={(e) => setForm({ ...form, imageUrls: e.target.value })}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono"
        />
        <p className="text-xs text-muted-foreground">O sube una imagen directamente:</p>
        <ImageUploader
          onUpload={(url) =>
            setForm((prev) => ({
              ...prev,
              imageUrls: prev.imageUrls ? `${prev.imageUrls}\n${url}` : url,
            }))
          }
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isCake}
          onChange={(e) => setForm({ ...form, isCake: e.target.checked })}
          className="w-4 h-4 rounded border-border"
        />
        <span className="text-sm font-medium">Es torta personalizable</span>
      </label>

      <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Disponibilidad</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {availabilityStatus === 'AVAILABLE' ? 'Disponible para la venta' : 'Agotado — no se puede agregar al carrito'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggleAvailability}
          disabled={togglingAvailability}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 ${
            availabilityStatus === 'AVAILABLE' ? 'bg-green-500' : 'bg-muted-foreground'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              availabilityStatus === 'AVAILABLE' ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
