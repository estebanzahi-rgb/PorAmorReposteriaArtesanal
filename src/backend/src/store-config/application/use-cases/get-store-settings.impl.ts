import { Inject, Injectable } from '@nestjs/common';
import { GetStoreSettingsUseCase } from '../../domain/ports/in/get-store-settings.use-case';
import { StoreSettingsRepository } from '../../domain/ports/out/store-settings.repository';
import { StoreSettings } from '../../domain/entities/store-settings.entity';
import { STORE_SETTINGS_REPOSITORY } from '../../store-config.tokens';

@Injectable()
export class GetStoreSettingsImpl implements GetStoreSettingsUseCase {
  constructor(
    @Inject(STORE_SETTINGS_REPOSITORY) private readonly repo: StoreSettingsRepository,
  ) {}

  async execute(): Promise<StoreSettings> {
    const settings = await this.repo.find();
    return settings ?? StoreSettings.create(24, 'system');
  }
}
