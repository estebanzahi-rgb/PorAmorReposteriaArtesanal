import { StoreSettings } from '../../entities/store-settings.entity';

export interface StoreSettingsRepository {
  find(): Promise<StoreSettings | null>;
  save(settings: StoreSettings): Promise<StoreSettings>;
}
