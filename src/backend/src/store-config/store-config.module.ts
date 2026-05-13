import { Module } from '@nestjs/common';
import { StoreSettingsPrismaRepository } from './infrastructure/persistence/store-settings.prisma.repository';
import { GetStoreSettingsImpl } from './application/use-cases/get-store-settings.impl';
import { UpdateStoreSettingsImpl } from './application/use-cases/update-store-settings.impl';
import { AdminStoreSettingsController } from './interfaces/http/admin-store-settings.controller';
import {
  STORE_SETTINGS_REPOSITORY,
  GET_STORE_SETTINGS_USE_CASE,
  UPDATE_STORE_SETTINGS_USE_CASE,
} from './store-config.tokens';

@Module({
  controllers: [AdminStoreSettingsController],
  providers: [
    { provide: STORE_SETTINGS_REPOSITORY, useClass: StoreSettingsPrismaRepository },
    { provide: GET_STORE_SETTINGS_USE_CASE, useClass: GetStoreSettingsImpl },
    { provide: UPDATE_STORE_SETTINGS_USE_CASE, useClass: UpdateStoreSettingsImpl },
  ],
})
export class StoreConfigModule {}
