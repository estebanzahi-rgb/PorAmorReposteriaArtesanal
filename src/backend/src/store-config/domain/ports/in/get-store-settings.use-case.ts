import { StoreSettings } from '../../entities/store-settings.entity';

export interface GetStoreSettingsUseCase {
  execute(): Promise<StoreSettings>;
}
