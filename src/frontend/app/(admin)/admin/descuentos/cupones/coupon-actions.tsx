'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@lib/api';

interface Props {
  code: string;
  isActive: boolean;
  token: string;
}

export function CouponActions({ code, isActive, token }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setLoading(true);
    try {
      await apiFetch(`/admin/discounts/coupons/${code}/toggle`, { method: 'PATCH', token });
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
        isActive
          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
          : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
      }`}
    >
      {loading ? '...' : isActive ? 'Desactivar' : 'Activar'}
    </button>
  );
}
