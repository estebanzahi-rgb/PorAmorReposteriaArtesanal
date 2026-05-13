'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function OrderSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams?.get('q') ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (value.trim()) {
      params.set('q', value.trim());
    } else {
      params.delete('q');
    }
    router.push(`/admin/pedidos?${params.toString()}`);
  };

  const handleClear = () => {
    setValue('');
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.delete('q');
    router.push(`/admin/pedidos?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1 max-w-xs">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Buscar por cliente..."
          className="w-full pl-3 pr-8 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
          >
            ✕
          </button>
        )}
      </div>
      <button
        type="submit"
        className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
      >
        Buscar
      </button>
    </form>
  );
}
