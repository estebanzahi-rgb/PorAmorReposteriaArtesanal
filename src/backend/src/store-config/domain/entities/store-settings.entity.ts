import { LeadTimeHours } from '../value-objects/lead-time-hours.vo';

export class StoreSettings {
  constructor(
    public readonly id: string,
    public readonly leadTime: LeadTimeHours,
    public readonly updatedAt: Date,
    public readonly updatedBy: string,
  ) {}

  static create(leadTimeHours: number, updatedBy: string): StoreSettings {
    return new StoreSettings(
      'singleton',
      LeadTimeHours.of(leadTimeHours),
      new Date(),
      updatedBy,
    );
  }

  withLeadTime(hours: number, updatedBy: string): StoreSettings {
    return new StoreSettings(
      this.id,
      LeadTimeHours.of(hours),
      new Date(),
      updatedBy,
    );
  }
}
