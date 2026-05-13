import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { StoreSettingsRepository } from '../../domain/ports/out/store-settings.repository';
import { StoreSettings } from '../../domain/entities/store-settings.entity';
import { LeadTimeHours } from '../../domain/value-objects/lead-time-hours.vo';

@Injectable()
export class StoreSettingsPrismaRepository implements StoreSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async find(): Promise<StoreSettings | null> {
    const raw = await this.prisma.storeSettings.findUnique({ where: { id: 'singleton' } });
    return raw ? this.toDomain(raw) : null;
  }

  async save(settings: StoreSettings): Promise<StoreSettings> {
    const raw = await this.prisma.storeSettings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        leadTimeHours: settings.leadTime.value,
        updatedBy: settings.updatedBy,
      },
      update: {
        leadTimeHours: settings.leadTime.value,
        updatedBy: settings.updatedBy,
      },
    });
    return this.toDomain(raw);
  }

  private toDomain(raw: { id: string; leadTimeHours: number; updatedAt: Date; updatedBy: string }): StoreSettings {
    return new StoreSettings(
      raw.id,
      LeadTimeHours.of(raw.leadTimeHours),
      raw.updatedAt,
      raw.updatedBy,
    );
  }
}
