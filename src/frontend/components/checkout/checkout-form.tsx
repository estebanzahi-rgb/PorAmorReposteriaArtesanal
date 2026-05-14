'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { formatCOP } from '@lib/utils';
import { apiFetch } from '@lib/api';
import { clearAnonymousCart } from '@lib/cart-storage';
import { useCart } from '@lib/cart-context';
import { ScheduledAtPicker } from './ScheduledAtPicker';
import type { CartItemDto, OrderDto, PlaceOrderRequest, DeliveryType, PaymentMethod } from '@types-app/index';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string; note: string; disabled?: boolean }[] = [
  { value: 'BANK_TRANSFER', label: 'Transferencia bancaria', icon: '🏦', note: 'Bancolombia' },
  { value: 'MERCADOPAGO', label: 'Mercado Pago', icon: '💚', note: 'Próximamente', disabled: true },
];

interface DiscountPreview {
  regularDiscount: number;
  couponDiscount: number;
  total: number;
  lines: { description: string; amount: number }[];
}

interface CheckoutFormProps {
  cartItems: CartItemDto[];
  deliveryRate: number;
  discountPreview: DiscountPreview | null;
}

export function CheckoutForm({ cartItems, deliveryRate, discountPreview }: CheckoutFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { refresh } = useCart();

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('PICKUP');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [couponCode, setCouponCode] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customerName: session?.user?.name ?? '',
    customerPhone: '',
    customerEmail: session?.user?.email ?? '',
    deliveryStreet: '',
    deliveryCity: '',
    deliveryNotes: '',
  });

  const subtotal = cartItems.reduce((acc, i) => acc + i.subtotal, 0);
  const shipping = deliveryType === 'DELIVERY' ? deliveryRate : 0;
  const total = subtotal + shipping;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.backendToken) return;
    if (cartItems.length === 0) {
      setError('Tu carrito está vacío');
      return;
    }
    if (deliveryType === 'DELIVERY' && (!form.deliveryStreet || !form.deliveryCity)) {
      setError('Ingresa la dirección de entrega');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload: PlaceOrderRequest = {
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail,
      deliveryType,
      deliveryStreet: deliveryType === 'DELIVERY' ? form.deliveryStreet : undefined,
      deliveryCity: deliveryType === 'DELIVERY' ? form.deliveryCity : undefined,
      deliveryNotes: form.deliveryNotes || undefined,
      paymentMethod,
      couponCode: couponCode.trim().toUpperCase() || undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      items: cartItems.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        variantId: i.variantId,
        variantName: i.variantName,
        cakeConfig: i.cakeConfig,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        imageUrl: i.imageUrl,
      })),
    };

    try {
      const order = await apiFetch<OrderDto>('/orders', {
        method: 'POST',
        token: session.backendToken,
        body: JSON.stringify(payload),
      });
      await apiFetch('/cart', { method: 'DELETE', token: session.backendToken }).catch(() => {});
      clearAnonymousCart();
      refresh();

      if (paymentMethod === 'MERCADOPAGO') {
        const { initPoint } = await apiFetch<{ initPoint: string }>(
          '/payments/mercadopago/create-preference',
          { method: 'POST', token: session.backendToken, body: JSON.stringify({ orderId: order.id }) },
        );
        window.location.href = initPoint;
        return;
      }

      router.push(`/checkout/confirmacion/${order.id}`);
    } catch (err) {
      setError((err as Error).message ?? 'Error al procesar el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left column — form fields */}
      <div className="lg:col-span-2 space-y-6">
        {/* Customer info */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Datos del contacto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nombre completo</label>
              <input
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                required
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Teléfono / WhatsApp</label>
              <input
                name="customerPhone"
                value={form.customerPhone}
                onChange={handleChange}
                required
                placeholder="+57 300 000 0000"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Correo electrónico</label>
            <input
              name="customerEmail"
              type="email"
              value={form.customerEmail}
              onChange={handleChange}
              required
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </section>

        {/* Delivery type */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Método de entrega</h2>
          <div className="grid grid-cols-2 gap-3">
            {([['PICKUP', '🏪', 'Recoger en tienda', 'Sin costo adicional'], ['DELIVERY', '🛵', 'Domicilio', `+${formatCOP(deliveryRate)}`]] as const).map(
              ([val, icon, label, note]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDeliveryType(val)}
                  className={`flex flex-col items-center gap-1 p-4 border-2 rounded-xl transition-colors ${
                    deliveryType === val
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="font-medium text-sm">{label}</span>
                  <span className="text-xs text-muted-foreground">{note}</span>
                </button>
              ),
            )}
          </div>

          {deliveryType === 'DELIVERY' && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Dirección</label>
                <input
                  name="deliveryStreet"
                  value={form.deliveryStreet}
                  onChange={handleChange}
                  required
                  placeholder="Calle 123 # 45-67"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Ciudad</label>
                <input
                  name="deliveryCity"
                  value={form.deliveryCity}
                  onChange={handleChange}
                  required
                  placeholder="Bogotá"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Indicaciones adicionales (opcional)</label>
                <textarea
                  name="deliveryNotes"
                  value={form.deliveryNotes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Apto 301, timbre no funciona..."
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
          )}
        </section>

        {/* Payment method */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Método de pago</h2>
          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_OPTIONS.map(({ value, icon, label, note, disabled }) => (
              <button
                key={value}
                type="button"
                onClick={() => !disabled && setPaymentMethod(value)}
                disabled={disabled}
                className={`relative flex flex-col items-center gap-1 p-4 border-2 rounded-xl transition-colors ${
                  disabled
                    ? 'border-border opacity-40 cursor-not-allowed'
                    : paymentMethod === value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <span className="text-2xl">{icon}</span>
                <span className="font-medium text-sm">{label}</span>
                <span className="text-xs text-muted-foreground">{note}</span>
              </button>
            ))}
          </div>

          {paymentMethod === 'BANK_TRANSFER' && (
            <div className="flex items-start gap-3 p-4 border border-border rounded-xl bg-muted/30">
              <div className="space-y-1 text-sm">
                <p className="font-semibold">Bancolombia — Cuenta de ahorros</p>
                <p className="text-muted-foreground">Número: <strong>123-456-777</strong></p>
                <p className="text-muted-foreground">Llave: <strong>1036626558</strong></p>
                <p className="text-xs text-muted-foreground mt-2">
                  Después de confirmar, envía el comprobante por WhatsApp.
                </p>
              </div>
            </div>
          )}

          {paymentMethod === 'MERCADOPAGO' && (
            <p className="text-sm text-muted-foreground">
              Serás redirigido a Mercado Pago para completar el pago de forma segura.
            </p>
          )}
        </section>

        {/* Coupon */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h2 className="text-lg font-semibold">Cupón de descuento (opcional)</h2>
          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="CÓDIGO"
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary uppercase"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            El descuento del cupón se aplica al confirmar el pedido.
          </p>
        </section>

        <ScheduledAtPicker value={scheduledAt} onChange={setScheduledAt} />
      </div>

      {/* Right column — summary */}
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4 sticky top-4">
          <h2 className="text-lg font-semibold">Resumen del pedido</h2>

          <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex justify-between gap-2">
                <span className="text-muted-foreground truncate">
                  {item.productName}
                  {item.variantName ? ` (${item.variantName})` : ''}
                  {' '}×{item.quantity}
                </span>
                <span className="flex-shrink-0">{formatCOP(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
            {discountPreview && discountPreview.regularDiscount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Descuento por cantidad</span>
                <span>-{formatCOP(discountPreview.regularDiscount)}</span>
              </div>
            )}
            {deliveryType === 'DELIVERY' && (
              <div className="flex justify-between text-muted-foreground">
                <span>Domicilio</span>
                <span>{formatCOP(shipping)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
            <span>Total estimado</span>
            <span>{formatCOP(total - (discountPreview?.regularDiscount ?? 0))}</span>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || cartItems.length === 0}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Procesando...' : 'Confirmar pedido'}
          </button>

          <p className="text-xs text-center text-muted-foreground">
            Al confirmar aceptas nuestros términos de servicio
          </p>
        </div>
      </div>
    </form>
  );
}
