import { CakeOption } from '../../entities/cake-option.entity';

export interface CakeOptionRepository {
  findAllActive(): Promise<CakeOption[]>;
  findAll(): Promise<CakeOption[]>;
  findById(id: string): Promise<CakeOption | null>;
  save(option: CakeOption): Promise<CakeOption>;
  updateStatus(id: string, isActive: boolean): Promise<CakeOption>;
}
