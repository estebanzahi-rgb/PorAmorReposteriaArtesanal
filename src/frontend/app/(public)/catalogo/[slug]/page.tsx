import { notFound } from 'next/navigation';
import Image from 'next/image';
import { serverFetch } from '@lib/api';
import { CakeConfigurator } from '@components/catalog/cake-configurator';
import { ProductNonCakeSection } from '@components/catalog/product-non-cake-section';
import type { ProductDto, CakeConfiguratorOptionsDto } from '@types-app/index';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await serverFetch<ProductDto>(`/catalog/${slug}`);
    return { title: product.name, description: product.description };
  } catch {
    return { title: 'Producto no encontrado' };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  let product: ProductDto;
  let cakeOptions: CakeConfiguratorOptionsDto | null = null;

  try {
    product = await serverFetch<ProductDto>(`/catalog/${slug}`);
  } catch {
    notFound();
  }

  if (product.isCake) {
    try {
      cakeOptions = await serverFetch<CakeConfiguratorOptionsDto>('/catalog/cake-configurator');
    } catch {
      cakeOptions = null;
    }
  }

  const mainImage = product.images?.[0];
  const discountedPrice = product.activeDiscountPercentage
    ? product.basePrice * (1 - product.activeDiscountPercentage / 100)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Imagen */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">🎂</div>
            )}
            {product.activeDiscountPercentage && (
              <span className="absolute top-4 right-4 bg-destructive text-destructive-foreground text-sm font-bold px-3 py-1 rounded-full">
                -{product.activeDiscountPercentage}% OFF
              </span>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-brand-teal mb-1">{product.category.name}</p>
              <h1 className="font-display text-3xl font-bold text-brand-teal-dark">{product.name}</h1>
              <p className="font-serif text-muted-foreground mt-2">{product.description}</p>
            </div>

            {product.isCake && cakeOptions ? (
              <CakeConfigurator
                productId={product.id}
                productName={product.name}
                productImage={mainImage}
                options={cakeOptions}
              />
            ) : (
              !product.isCake && (
                <ProductNonCakeSection
                  productId={product.id}
                  productName={product.name}
                  imageUrl={mainImage}
                  basePrice={product.basePrice}
                  discountedPrice={discountedPrice}
                  variants={product.variants}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
