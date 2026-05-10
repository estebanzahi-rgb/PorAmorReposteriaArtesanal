export interface AnonymousCartItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  cakeConfig?: Record<string, string>;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

const CART_KEY = 'poramor_cart';

export function getAnonymousCart(): AnonymousCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as AnonymousCartItem[]) : [];
  } catch {
    return [];
  }
}

export function saveAnonymousCart(items: AnonymousCartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function clearAnonymousCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_KEY);
}

export function addToAnonymousCart(item: Omit<AnonymousCartItem, 'quantity'> & { quantity?: number }): void {
  const items = getAnonymousCart();
  const qty = item.quantity ?? 1;

  const existingIdx = item.cakeConfig
    ? -1 // cake configs always create separate items
    : items.findIndex(
        (i) => i.productId === item.productId && i.variantId === item.variantId,
      );

  if (existingIdx >= 0) {
    items[existingIdx].quantity += qty;
  } else {
    items.push({ ...item, quantity: qty });
  }

  saveAnonymousCart(items);
}
