import { auth } from '@lib/auth';
import { serverFetch } from '@lib/api';
import { formatCOP } from '@lib/utils';
import type { CakeOptionDto, CakeDimension } from '@types-app/index';
import { ToggleCakeOptionButton } from './toggle-option-button';
import { CreateCakeOptionForm } from './create-option-form';

const DIMENSION_LABELS: Record<CakeDimension, string> = {
  SIZE: 'Tamaño',
  FLAVOR: 'Sabor',
  FILLING: 'Relleno',
  TOPPING: 'Cobertura',
  TOPPER: 'Decoración',
};

export default async function ConfiguradorPage() {
  const session = await auth();

  let options: CakeOptionDto[] = [];
  try {
    options = await serverFetch<CakeOptionDto[]>('/admin/catalog/cake-options', {
      token: session!.backendToken,
    });
  } catch {
    options = [];
  }

  const grouped = (Object.keys(DIMENSION_LABELS) as CakeDimension[]).reduce(
    (acc, dim) => {
      acc[dim] = options.filter((o) => o.dimension === dim);
      return acc;
    },
    {} as Record<CakeDimension, CakeOptionDto[]>,
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--brand-brown))]">Configurador de tortas</h1>

      <CreateCakeOptionForm token={session!.backendToken} />

      <div className="space-y-4">
        {(Object.keys(DIMENSION_LABELS) as CakeDimension[]).map((dim) => (
          <div key={dim} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-muted/30 border-b border-border">
              <h2 className="font-semibold text-sm">{DIMENSION_LABELS[dim]}</h2>
            </div>
            {grouped[dim].length === 0 ? (
              <p className="px-4 py-4 text-sm text-muted-foreground">Sin opciones.</p>
            ) : (
              <div className="divide-y divide-border">
                {grouped[dim].map((opt) => (
                  <div
                    key={opt.id}
                    className="px-4 py-3 flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className={`font-medium ${!opt.isActive ? 'text-muted-foreground line-through' : ''}`}>
                        {opt.name}
                      </span>
                      {opt.priceModifier !== 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          +{formatCOP(opt.priceModifier)}
                        </span>
                      )}
                    </div>
                    <ToggleCakeOptionButton
                      optionId={opt.id}
                      isActive={opt.isActive}
                      token={session!.backendToken}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
