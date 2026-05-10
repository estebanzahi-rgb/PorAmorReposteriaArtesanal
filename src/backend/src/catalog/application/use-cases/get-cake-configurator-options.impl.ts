import { Inject, Injectable } from '@nestjs/common';
import {
  GetCakeConfiguratorOptionsUseCase,
  CakeConfiguratorOptions,
} from '../../domain/ports/in/get-cake-configurator-options.use-case';
import { CakeOptionRepository } from '../../domain/ports/out/cake-option.repository';
import { CakeDimension } from '../../domain/entities/cake-option.entity';
import { CAKE_OPTION_REPOSITORY } from '../../catalog.tokens';

@Injectable()
export class GetCakeConfiguratorOptionsImpl implements GetCakeConfiguratorOptionsUseCase {
  constructor(
    @Inject(CAKE_OPTION_REPOSITORY)
    private readonly cakeOptionRepo: CakeOptionRepository,
  ) {}

  async execute(): Promise<CakeConfiguratorOptions> {
    const options = await this.cakeOptionRepo.findAllActive();

    const grouped: CakeConfiguratorOptions = {
      SIZE: [],
      FLAVOR: [],
      FILLING: [],
      TOPPING: [],
      TOPPER: [],
    };

    for (const option of options) {
      grouped[option.dimension as CakeDimension].push(option);
    }

    return grouped;
  }
}
