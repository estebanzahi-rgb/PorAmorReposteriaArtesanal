'use client';
import { useEffect } from 'react';
import { useGA4 } from '../../hooks/useGA4';

interface Props {
  id: string;
  name: string;
  price: number;
  category?: string;
}

export function ProductViewTracker({ id, name, price, category }: Props) {
  const { trackViewItem } = useGA4();
  useEffect(() => {
    trackViewItem({ id, name, price, category });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return null;
}
