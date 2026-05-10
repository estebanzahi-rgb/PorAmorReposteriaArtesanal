import { Order, DeliveryType, PaymentMethod } from '../../entities/order.entity';

export interface CheckoutItemCommand {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  cakeConfig?: Record<string, string>;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

export interface PlaceOrderCommand {
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryType: DeliveryType;
  deliveryStreet?: string;
  deliveryCity?: string;
  deliveryNotes?: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  items: CheckoutItemCommand[];
}

export interface PlaceOrderUseCase {
  execute(command: PlaceOrderCommand): Promise<Order>;
}
