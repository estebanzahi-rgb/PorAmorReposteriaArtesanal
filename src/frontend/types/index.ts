export type UserRole = 'USER' | 'ADMIN';
export type ProductStatus = 'ACTIVE' | 'INACTIVE';
export type DeliveryType = 'PICKUP' | 'DELIVERY';
export type PaymentMethod = 'BANK_TRANSFER' | 'PSE' | 'CARD' | 'MERCADOPAGO';
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'RECEIVED'
  | 'IN_PREPARATION'
  | 'READY'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';
export type CakeDimension = 'SIZE' | 'FLAVOR' | 'FILLING' | 'TOPPING' | 'TOPPER';

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
}

export interface ProductVariantDto {
  id: string;
  name: string;
  priceModifier: number;
  isActive: boolean;
}

export interface CakeOptionDto {
  id: string;
  name: string;
  dimension: CakeDimension;
  priceModifier: number;
  isActive: boolean;
}

export interface CakeConfiguratorOptionsDto {
  sizes: CakeOptionDto[];
  flavors: CakeOptionDto[];
  fillings: CakeOptionDto[];
  toppings: CakeOptionDto[];
  toppers: CakeOptionDto[];
}

export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  status: ProductStatus;
  isCake: boolean;
  images: string[];
  category: CategoryDto;
  variants: ProductVariantDto[];
  activeDiscountPercentage: number | null;
  quantityDiscount: { minQuantity: number; percentage: number } | null;
}

export interface CartItemDto {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  cakeConfig?: Record<string, string>;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
}

export interface CartDto {
  id: string;
  items: CartItemDto[];
  total: number;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  variantName?: string;
  cakeConfig?: Record<string, string>;
  quantity: number;
  unitPrice: number;
  discountedUnitPrice?: number;
  subtotal: number;
  imageUrl?: string;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryStreet?: string;
  deliveryCity?: string;
  deliveryNotes?: string;
  couponCode?: string;
  subtotal: number;
  deliveryCost: number;
  discountAmount: number;
  couponAmount: number;
  total: number;
  items: OrderItemDto[];
  createdAt: string;
}

export interface PlaceOrderRequest {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryType: DeliveryType;
  deliveryStreet?: string;
  deliveryCity?: string;
  deliveryNotes?: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  items: Array<{
    productId: string;
    productName: string;
    variantId?: string;
    variantName?: string;
    cakeConfig?: Record<string, string>;
    quantity: number;
    unitPrice: number;
    imageUrl?: string;
  }>;
}

export interface DiscountLineDto {
  description: string;
  amount: number;
  type: string;
}

export interface DiscountSummaryDto {
  lines: DiscountLineDto[];
  regularDiscount: number;
  couponDiscount: number;
  total: number;
  clarificationNote?: string;
}

export interface DeliveryRateDto {
  amount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
