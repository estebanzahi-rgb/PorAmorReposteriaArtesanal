import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';

  const res = await fetch(`${apiUrl}/catalog/products`, { next: { revalidate: 3600 } });
  const products = res.ok ? await res.json() : [];

  const productUrls = (products as Array<{ slug: string; updatedAt: string }>)
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${baseUrl}/catalogo/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/catalogo`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...productUrls,
  ];
}
