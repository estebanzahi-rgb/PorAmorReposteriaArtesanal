export type CakeDimension = 'SIZE' | 'FLAVOR' | 'FILLING' | 'TOPPING' | 'TOPPER';

export class CakeOption {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly dimension: CakeDimension,
    public readonly priceModifier: number,
    public readonly isActive: boolean,
  ) {}
}
