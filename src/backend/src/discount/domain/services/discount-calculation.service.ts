import { Money } from '../../../shared/domain/value-objects/money.vo';

export interface DiscountableItem {
  productId: string;
  quantity: number;
  unitPrice: Money;
}

export interface DiscountLine {
  description: string;
  amount: Money;
  type: 'PRODUCT_DISCOUNT' | 'QUANTITY_DISCOUNT' | 'COUPON';
}

export interface DiscountResult {
  lines: DiscountLine[];
  regularDiscount: Money;
  couponDiscount: Money;
  total: Money;
  clarificationNote?: string; // cuando gana el mayor entre product y quantity
}

// S — SRP: la lógica de cálculo de descuentos está encapsulada aquí,
//     desacoplada de Order y de Discount CRUD
export interface DiscountCalculationService {
  calculate(items: DiscountableItem[], couponCode?: string): Promise<DiscountResult>;
}
