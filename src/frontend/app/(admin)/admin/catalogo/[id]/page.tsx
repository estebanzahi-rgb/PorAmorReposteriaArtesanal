import { auth } from '@lib/auth';
import { serverFetch } from '@lib/api';
import { formatCOP } from '@lib/utils';
import type { ProductDto } from '@types-app/index';
import { EditProductForm } from './edit-product-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarProductoPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const product = await serverFetch<ProductDto>(`/admin/catalog/${id}`, {
    token: session!.backendToken,
  }).catch(() => null);

  if (!product) {
    return (
      <div className="text-muted-foreground text-sm">Producto no encontrado.</div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[hsl(var(--brand-brown))]">
          Editar: {product.name}
        </h1>
        <span className="text-sm text-muted-foreground">{formatCOP(product.basePrice)}</span>
      </div>

      <EditProductForm product={product} token={session!.backendToken} />
    </div>
  );
}
