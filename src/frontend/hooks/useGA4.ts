declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function useGA4() {
  function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, params);
    }
  }

  function trackViewItem(product: {
    id: string;
    name: string;
    price: number;
    category?: string;
  }) {
    trackEvent('view_item', {
      currency: 'COP',
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price,
          quantity: 1,
        },
      ],
    });
  }

  function trackBeginCheckout(
    total: number,
    items: Array<{ id: string; name: string; price: number; quantity: number }>,
  ) {
    trackEvent('begin_checkout', {
      currency: 'COP',
      value: total,
      items: items.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  }

  return { trackViewItem, trackBeginCheckout, trackEvent };
}
