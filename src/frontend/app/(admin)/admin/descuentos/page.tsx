import { auth } from '@lib/auth';
import { serverFetch } from '@lib/api';
import type { ProductDto } from '@types-app/index';
import { DiscountsManager } from './discounts-manager';

interface ProductDiscountData {
  id: string;
  productId: string;
  percentage: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

interface QuantityRuleData {
  id: string;
  productId: string;
  minQuantity: number;
  percentage: number;
  isActive: boolean;
}

export default async function DescuentosPage() {
  const session = await auth();
  const token = session!.backendToken;

  const [products, productDiscounts, quantityRules] = await Promise.all([
    serverFetch<ProductDto[]>('/admin/catalog', { token }).catch(() => [] as ProductDto[]),
    serverFetch<ProductDiscountData[]>('/admin/discounts/products', { token }).catch(
      () => [] as ProductDiscountData[],
    ),
    serverFetch<QuantityRuleData[]>('/admin/discounts/quantity-rules', { token }).catch(
      () => [] as QuantityRuleData[],
    ),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--brand-brown))]">Descuentos</h1>
      <DiscountsManager
        products={products}
        productDiscounts={productDiscounts}
        quantityRules={quantityRules}
        token={token}
      />
    </div>
  );
}
