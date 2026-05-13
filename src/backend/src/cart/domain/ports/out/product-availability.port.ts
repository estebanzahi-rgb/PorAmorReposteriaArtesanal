export interface ProductAvailabilityPort {
  isAvailable(productId: string): Promise<boolean>;
}
