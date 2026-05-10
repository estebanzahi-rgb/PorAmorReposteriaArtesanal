import { auth } from '@lib/auth';
import { serverFetch } from '@lib/api';
import { formatCOP } from '@lib/utils';
import { CouponActions } from './coupon-actions';
import { CreateCouponForm } from './create-coupon-form';

interface CouponData {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_VALUE';
  value: number;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

export default async function CuponesPage() {
  const session = await auth();
  const token = session!.backendToken;

  let coupons: CouponData[] = [];
  try {
    coupons = await serverFetch<CouponData[]>('/admin/discounts/coupons', { token });
  } catch {
    coupons = [];
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--brand-brown))]">Cupones</h1>

      <CreateCouponForm token={token} />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Tipo</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Valor</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Usos</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No hay cupones creados.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium">{c.code}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    {c.type === 'PERCENTAGE' ? 'Porcentaje' : 'Valor fijo'}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    {c.type === 'PERCENTAGE' ? `${c.value}%` : formatCOP(c.value)}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    {c.usageCount}
                    {c.usageLimit != null ? ` / ${c.usageLimit}` : ' / ∞'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {c.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CouponActions code={c.code} isActive={c.isActive} token={token} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
