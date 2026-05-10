import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { DeliveryRateRepository } from '../../domain/ports/out/delivery-rate.repository';
import { Money } from '../../../shared/domain/value-objects/money.vo';

@Injectable()
export class DeliveryRatePrismaRepository implements DeliveryRateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAmount(): Promise<Money> {
    const rate = await this.prisma.deliveryRate.findFirst();
    return rate ? Money.of(Number(rate.amount)) : Money.of(0);
  }
}
