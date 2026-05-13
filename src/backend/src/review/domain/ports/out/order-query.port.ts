export interface OrderQueryPort {
  hasPurchasedProduct(userId: string, productId: string): Promise<boolean>;
}
