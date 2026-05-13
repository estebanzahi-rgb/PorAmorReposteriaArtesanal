import { StoreSettings } from '../../entities/store-settings.entity';

export interface UpdateStoreSettingsCommand {
  leadTimeHours: number;
  updatedBy: string;
}

export interface UpdateStoreSettingsUseCase {
  execute(command: UpdateStoreSettingsCommand): Promise<StoreSettings>;
}
