export class LeadTimeHours {
  private constructor(public readonly value: number) {}

  static of(hours: number): LeadTimeHours {
    if (!Number.isInteger(hours) || hours < 0) {
      throw new Error('LeadTimeHours must be a non-negative integer');
    }
    if (hours > 720) {
      throw new Error('LeadTimeHours cannot exceed 720 (30 days)');
    }
    return new LeadTimeHours(hours);
  }
}
