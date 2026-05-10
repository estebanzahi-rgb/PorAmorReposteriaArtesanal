import { Injectable } from '@nestjs/common';
import type { CakeOption as PrismaCakeOption } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { CakeOptionRepository } from '../../domain/ports/out/cake-option.repository';
import { CakeOption, CakeDimension } from '../../domain/entities/cake-option.entity';

@Injectable()
export class CakeOptionPrismaRepository implements CakeOptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive(): Promise<CakeOption[]> {
    const records = await this.prisma.cakeOption.findMany({
      where: { isActive: true },
      orderBy: [{ dimension: 'asc' }, { name: 'asc' }],
    });
    return records.map((r) => this.toDomain(r));
  }

  async findAll(): Promise<CakeOption[]> {
    const records = await this.prisma.cakeOption.findMany({
      orderBy: [{ dimension: 'asc' }, { name: 'asc' }],
    });
    return records.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<CakeOption | null> {
    const record = await this.prisma.cakeOption.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async save(option: CakeOption): Promise<CakeOption> {
    const record = await this.prisma.cakeOption.upsert({
      where: { id: option.id },
      create: {
        id: option.id,
        name: option.name,
        dimension: option.dimension,
        priceModifier: option.priceModifier,
        isActive: option.isActive,
      },
      update: {
        name: option.name,
        priceModifier: option.priceModifier,
        isActive: option.isActive,
      },
    });
    return this.toDomain(record);
  }

  async updateStatus(id: string, isActive: boolean): Promise<CakeOption> {
    const record = await this.prisma.cakeOption.update({
      where: { id },
      data: { isActive },
    });
    return this.toDomain(record);
  }

  private toDomain(record: PrismaCakeOption): CakeOption {
    return new CakeOption(
      record.id,
      record.name,
      record.dimension as CakeDimension,
      Number(record.priceModifier),
      record.isActive,
    );
  }
}
