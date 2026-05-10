import { auth } from '@lib/auth';
import { serverFetch } from '@lib/api';
import { formatCOP } from '@lib/utils';
import Link from 'next/link';
import type { ProductDto } from '@types-app/index';
import { ToggleProductStatusButton } from './toggle-status-button';

export default async function AdminCatalogoPage() {
  const session = await auth();

  let products: ProductDto[] = [];
  try {
    products = await serverFetch<ProductDto[]>('/admin/catalog', {
      token: session!.backendToken,
    });
  } catch {
    products = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[hsl(var(--brand-brown))]">Catálogo</h1>
        <Link
          href="/admin/catalogo/nuevo"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Producto</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoría</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Precio base</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No hay productos registrados.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images[0] && (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div>
                        <p className="font-medium">{p.name}</p>
                        {p.isCake && (
                          <span className="text-xs text-muted-foreground">Torta personalizable</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCOP(p.basePrice)}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {p.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/catalogo/${p.id}`}
                        className="text-xs px-3 py-1 rounded-md border border-border hover:bg-muted transition-colors"
                      >
                        Editar
                      </Link>
                      <ToggleProductStatusButton
                        productId={p.id}
                        currentStatus={p.status}
                        token={session!.backendToken}
                      />
                    </div>
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
