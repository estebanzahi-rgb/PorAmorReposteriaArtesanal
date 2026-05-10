'use client';

import { formatCOP } from '@lib/utils';

interface PriceProps {
  amount: number;
  className?: string;
}

export function Price({ amount, className }: PriceProps) {
  return (
    <span suppressHydrationWarning className={className}>
      {formatCOP(amount)}
    </span>
  );
}
