import { CakeOption, CakeDimension } from '../../entities/cake-option.entity';

export interface CreateCakeOptionInput {
  name: string;
  dimension: CakeDimension;
  priceModifier: number;
}

export interface CreateCakeOptionUseCase {
  execute(input: CreateCakeOptionInput): Promise<CakeOption>;
}
