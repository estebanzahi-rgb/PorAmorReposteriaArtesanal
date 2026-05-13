import { useMemo, useState } from 'react';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

export function useProductSearch<
  T extends { name: string; description: string; category?: { name: string } },
>(products: T[]) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return products;
    return products.filter((p) => {
      const target = normalize(
        `${p.name} ${p.description} ${p.category?.name ?? ''}`,
      );
      return target.includes(q);
    });
  }, [query, products]);

  return { query, setQuery, filtered };
}
