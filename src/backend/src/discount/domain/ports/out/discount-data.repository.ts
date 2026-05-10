export interface ProductDiscountData {
  id: string;
  productId: string;
  percentage: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
}

export interface QuantityRuleData {
  id: string;
  productId: string;
  minQuantity: number;
  percentage: number;
  isActive: boolean;
}

export interface CouponData {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_VALUE';
  value: number;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
}

export interface SaveProductDiscountParams {
  productId: string;
  percentage: number;
  startsAt: Date;
  endsAt: Date;
}

export interface SaveQuantityRuleParams {
  productId: string;
  minQuantity: number;
  percentage: number;
}

export interface SaveCouponParams {
  code: string;
  type: 'PERCENTAGE' | 'FIXED_VALUE';
  value: number;
  usageLimit?: number;
  createdBy: string;
}

export interface DiscountDataRepository {
  findActiveProductDiscounts(productIds: string[]): Promise<ProductDiscountData[]>;
  findActiveQuantityRules(productIds: string[]): Promise<QuantityRuleData[]>;
  findActiveCoupon(code: string): Promise<CouponData | null>;
  incrementCouponUsage(code: string): Promise<void>;

  // Admin operations
  findAllProductDiscounts(): Promise<ProductDiscountData[]>;
  findAllQuantityRules(): Promise<QuantityRuleData[]>;
  findAllCoupons(): Promise<CouponData[]>;
  saveProductDiscount(params: SaveProductDiscountParams): Promise<ProductDiscountData>;
  deactivateProductDiscount(productId: string): Promise<void>;
  saveQuantityRule(params: SaveQuantityRuleParams): Promise<QuantityRuleData>;
  deactivateQuantityRule(productId: string): Promise<void>;
  saveCoupon(params: SaveCouponParams): Promise<CouponData>;
  toggleCoupon(code: string): Promise<CouponData>;
}
