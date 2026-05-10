'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@lib/api';
import type { ProductStatus } from '@types-app/index';

interface Props {
  productId: string;
  currentStatus: ProductStatus;
  token: string;
}

export function ToggleProductStatusButton({ productId, currentStatus, token }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setLoading(true);
    try {
      await apiFetch(`/admin/catalog/${productId}/status`, {
        method: 'PATCH',
        token,
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`text-xs px-3 py-1 rounded-md font-medium transition-colors disabled:opacity-50 ${
        currentStatus === 'ACTIVE'
          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
          : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
      }`}
    >
      {loading ? '...' : currentStatus === 'ACTIVE' ? 'Desactivar' : 'Activar'}
    </button>
  );
}
