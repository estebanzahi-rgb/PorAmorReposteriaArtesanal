import { Inject, Injectable } from '@nestjs/common';
import {
  CreateCakeOptionUseCase,
  CreateCakeOptionInput,
} from '../../domain/ports/in/create-cake-option.use-case';
import { CakeOptionRepository } from '../../domain/ports/out/cake-option.repository';
import { CakeOption } from '../../domain/entities/cake-option.entity';
import { CAKE_OPTION_REPOSITORY } from '../../catalog.tokens';

@Injectable()
export class CreateCakeOptionImpl implements CreateCakeOptionUseCase {
  constructor(
    @Inject(CAKE_OPTION_REPOSITORY)
    private readonly cakeOptionRepo: CakeOptionRepository,
  ) {}

  execute(input: CreateCakeOptionInput): Promise<CakeOption> {
    const option = new CakeOption(
      crypto.randomUUID(),
      input.name,
      input.dimension,
      input.priceModifier,
      true,
    );
    return this.cakeOptionRepo.save(option);
  }
}
