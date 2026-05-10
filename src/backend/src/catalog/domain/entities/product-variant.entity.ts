export class ProductVariant {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly name: string,
    public readonly priceModifier: number,
    public readonly isActive: boolean,
  ) {}
}
