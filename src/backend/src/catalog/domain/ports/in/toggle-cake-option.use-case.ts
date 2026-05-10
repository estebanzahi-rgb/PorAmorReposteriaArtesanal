import { CakeOption } from '../../entities/cake-option.entity';

export interface ToggleCakeOptionUseCase {
  execute(id: string): Promise<CakeOption>;
}
