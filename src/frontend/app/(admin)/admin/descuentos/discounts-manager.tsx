'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@lib/api';
import type { ProductDto } from '@types-app/index';

interface ProductDiscount {
  id: string;
  productId: string;
  percentage: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

interface QuantityRule {
  id: string;
  productId: string;
  minQuantity: number;
  percentage: number;
  isActive: boolean;
}

interface Props {
  products: ProductDto[];
  productDiscounts: ProductDiscount[];
  quantityRules: QuantityRule[];
  token: string;
}

export function DiscountsManager({ products, productDiscounts, quantityRules, token }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'product' | 'quantity'>('product');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [pdForm, setPdForm] = useState({
    productId: '',
    percentage: '',
    startsAt: '',
    endsAt: '',
  });

  const [qrForm, setQrForm] = useState({
    productId: '',
    minQuantity: '',
    percentage: '',
  });

  const productMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

  async function handleSetProductDiscount(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/admin/discounts/products/${pdForm.productId}`, {
        method: 'POST',
        body: JSON.stringify({
          percentage: Number(pdForm.percentage),
          startsAt: pdForm.startsAt,
          endsAt: pdForm.endsAt,
        }),
        token,
      });
      setPdForm({ productId: '', percentage: '', startsAt: '', endsAt: '' });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivateProductDiscount(productId: string) {
    try {
      await apiFetch(`/admin/discounts/products/${productId}`, { method: 'DELETE', token });
      router.refresh();
    } catch {
      // ignore
    }
  }

  async function handleSetQuantityRule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/admin/discounts/quantity-rules/${qrForm.productId}`, {
        method: 'POST',
        body: JSON.stringify({
          minQuantity: Number(qrForm.minQuantity),
          percentage: Number(qrForm.percentage),
        }),
        token,
      });
      setQrForm({ productId: '', minQuantity: '', percentage: '' });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivateQuantityRule(productId: string) {
    try {
      await apiFetch(`/admin/discounts/quantity-rules/${productId}`, {
        method: 'DELETE',
        token,
      });
      router.refresh();
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setTab('product')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            tab === 'product'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Por producto
        </button>
        <button
          onClick={() => setTab('quantity')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            tab === 'quantity'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Por volumen
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {tab === 'product' && (
        <div className="space-y-4">
          <form
            onSubmit={handleSetProductDiscount}
            className="bg-card border border-border rounded-xl p-4 space-y-4"
          >
            <h2 className="font-semibold text-sm">Nuevo descuento por producto</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Producto</label>
                <select
                  required
                  value={pdForm.productId}
                  onChange={(e) => setPdForm({ ...pdForm, productId: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Seleccionar...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">% descuento</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="100"
                  value={pdForm.percentage}
                  onChange={(e) => setPdForm({ ...pdForm, percentage: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Desde</label>
                <input
                  required
                  type="date"
                  value={pdForm.startsAt}
                  onChange={(e) => setPdForm({ ...pdForm, startsAt: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Hasta</label>
                <input
                  required
                  type="date"
                  value={pdForm.endsAt}
                  onChange={(e) => setPdForm({ ...pdForm, endsAt: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar descuento'}
            </button>
          </form>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Producto</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">%</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Vigencia</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productDiscounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      Sin descuentos configurados.
                    </td>
                  </tr>
                ) : (
                  productDiscounts.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">{productMap[d.productId] ?? d.productId}</td>
                      <td className="px-4 py-3 text-center font-medium">{d.percentage}%</td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                        {new Date(d.startsAt).toLocaleDateString('es-CO')} —{' '}
                        {new Date(d.endsAt).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            d.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {d.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {d.isActive && (
                          <button
                            onClick={() => handleDeactivateProductDiscount(d.productId)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Desactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'quantity' && (
        <div className="space-y-4">
          <form
            onSubmit={handleSetQuantityRule}
            className="bg-card border border-border rounded-xl p-4 space-y-4"
          >
            <h2 className="font-semibold text-sm">Nueva regla por volumen</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Producto</label>
                <select
                  required
                  value={qrForm.productId}
                  onChange={(e) => setQrForm({ ...qrForm, productId: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Seleccionar...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Cantidad mínima</label>
                <input
                  required
                  type="number"
                  min="2"
                  value={qrForm.minQuantity}
                  onChange={(e) => setQrForm({ ...qrForm, minQuantity: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">% descuento</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="100"
                  value={qrForm.percentage}
                  onChange={(e) => setQrForm({ ...qrForm, percentage: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar regla'}
            </button>
          </form>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Producto</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Min. unidades</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">%</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quantityRules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      Sin reglas configuradas.
                    </td>
                  </tr>
                ) : (
                  quantityRules.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">{productMap[r.productId] ?? r.productId}</td>
                      <td className="px-4 py-3 text-center">{r.minQuantity}</td>
                      <td className="px-4 py-3 text-center font-medium">{r.percentage}%</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            r.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {r.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.isActive && (
                          <button
                            onClick={() => handleDeactivateQuantityRule(r.productId)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Desactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
