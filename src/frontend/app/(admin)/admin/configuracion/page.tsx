import { auth } from '@lib/auth';
import { serverFetch } from '@lib/api';
import { formatCOP } from '@lib/utils';
import { DeliveryRateForm } from './delivery-rate-form';
import { StoreSettingsManager } from './store-settings-manager';

export default async function ConfiguracionPage() {
  const session = await auth();

  const rate = await serverFetch<{ amount: number }>('/delivery-rate').catch(() => ({ amount: 0 }));
  const storeSettings = await serverFetch<{ leadTimeHours: number; updatedAt: string; updatedBy: string }>(
    '/admin/store-settings',
  ).catch(() => ({ leadTimeHours: 24, updatedAt: new Date().toISOString(), updatedBy: 'system' }));

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--brand-brown))]">Configuración</h1>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-semibold">Tarifa de domicilio</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Actualmente: <span className="font-medium text-foreground">{formatCOP(rate.amount)}</span>
          </p>
        </div>

        <DeliveryRateForm currentAmount={rate.amount} token={session!.backendToken} />
      </div>

      <StoreSettingsManager initial={storeSettings} />
    </div>
  );
}
