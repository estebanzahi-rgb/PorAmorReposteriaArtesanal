import Link from 'next/link';
import { formatCOP } from '@lib/utils';

interface CartSummaryProps {
  total: number;
  itemCount: number;
  checkoutHref?: string;
}

export function CartSummary({ total, itemCount, checkoutHref = '/checkout' }: CartSummaryProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4 sticky top-4">
      <h2 className="text-lg font-semibold">Resumen del pedido</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Productos ({itemCount})</span>
          <span>{formatCOP(total)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Domicilio</span>
          <span className="text-xs">Se calcula al confirmar</span>
        </div>
      </div>

      <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
        <span>Total</span>
        <span>{formatCOP(total)}</span>
      </div>

      <Link
        href={checkoutHref}
        className="block w-full text-center py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
      >
        Ir al pago
      </Link>
    </div>
  );
}
