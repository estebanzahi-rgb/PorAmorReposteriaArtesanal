import { Inject, Injectable } from '@nestjs/common';
import {
  UpdateStoreSettingsUseCase,
  UpdateStoreSettingsCommand,
} from '../../domain/ports/in/update-store-settings.use-case';
import { StoreSettingsRepository } from '../../domain/ports/out/store-settings.repository';
import { StoreSettings } from '../../domain/entities/store-settings.entity';
import { STORE_SETTINGS_REPOSITORY } from '../../store-config.tokens';

@Injectable()
export class UpdateStoreSettingsImpl implements UpdateStoreSettingsUseCase {
  constructor(
    @Inject(STORE_SETTINGS_REPOSITORY) private readonly repo: StoreSettingsRepository,
  ) {}

  async execute(command: UpdateStoreSettingsCommand): Promise<StoreSettings> {
    const current = await this.repo.find();
    const updated = current
      ? current.withLeadTime(command.leadTimeHours, command.updatedBy)
      : StoreSettings.create(command.leadTimeHours, command.updatedBy);
    return this.repo.save(updated);
  }
}
