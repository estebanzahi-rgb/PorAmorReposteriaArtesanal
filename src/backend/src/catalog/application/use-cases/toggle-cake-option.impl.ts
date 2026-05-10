import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ToggleCakeOptionUseCase } from '../../domain/ports/in/toggle-cake-option.use-case';
import { CakeOptionRepository } from '../../domain/ports/out/cake-option.repository';
import { CakeOption } from '../../domain/entities/cake-option.entity';
import { CAKE_OPTION_REPOSITORY } from '../../catalog.tokens';

@Injectable()
export class ToggleCakeOptionImpl implements ToggleCakeOptionUseCase {
  constructor(
    @Inject(CAKE_OPTION_REPOSITORY)
    private readonly cakeOptionRepo: CakeOptionRepository,
  ) {}

  async execute(id: string): Promise<CakeOption> {
    const existing = await this.cakeOptionRepo.findById(id);
    if (!existing) throw new NotFoundException(`Opción de torta no encontrada: ${id}`);

    return this.cakeOptionRepo.updateStatus(id, !existing.isActive);
  }
}
