import { CakeOption, CakeDimension } from '../../entities/cake-option.entity';

export type CakeConfiguratorOptions = Record<CakeDimension, CakeOption[]>;

export interface GetCakeConfiguratorOptionsUseCase {
  execute(): Promise<CakeConfiguratorOptions>;
}
