import { Money } from '../../../../shared/domain/value-objects/money.vo';

export interface DeliveryRateRepository {
  findAmount(): Promise<Money>;
}
