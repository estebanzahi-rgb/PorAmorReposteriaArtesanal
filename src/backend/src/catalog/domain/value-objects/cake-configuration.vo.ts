// Invariante: toppingDescription es obligatorio cuando toppingType = VINTAGE
export type ToppingType = 'NAKED' | 'VINTAGE';

export class CakeConfiguration {
  private constructor(
    public readonly sizeId: string,
    public readonly flavorId: string,
    public readonly fillingId: string,
    public readonly toppingType: ToppingType,
    public readonly toppingDescription: string | undefined,
    public readonly message: string | undefined,
    public readonly drawing: string | undefined,
    public readonly topperId: string | undefined,
  ) {}

  static create(props: {
    sizeId: string;
    flavorId: string;
    fillingId: string;
    toppingType: ToppingType;
    toppingDescription?: string;
    message?: string;
    drawing?: string;
    topperId?: string;
  }): CakeConfiguration {
    if (props.toppingType === 'VINTAGE' && !props.toppingDescription?.trim()) {
      throw new Error('toppingDescription is required when toppingType is VINTAGE');
    }
    if (props.message && props.message.length > 60) {
      throw new Error('message cannot exceed 60 characters');
    }
    return new CakeConfiguration(
      props.sizeId,
      props.flavorId,
      props.fillingId,
      props.toppingType,
      props.toppingDescription,
      props.message,
      props.drawing,
      props.topperId,
    );
  }
}
