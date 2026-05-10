import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/interfaces/http/guards/roles.guard';
import { Roles } from '../../../auth/interfaces/http/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/interfaces/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/interfaces/http/types/authenticated-user';
import { DELIVERY_RATE_REPOSITORY } from '../../order.tokens';
import { DeliveryRateRepository } from '../../domain/ports/out/delivery-rate.repository';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';

class UpdateDeliveryRateDto {
  @IsNumber() @Min(0) amount: number;
}

@ApiTags('delivery-rate')
@Controller('delivery-rate')
export class DeliveryRateController {
  constructor(
    @Inject(DELIVERY_RATE_REPOSITORY) private readonly repo: DeliveryRateRepository,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener tarifa de domicilio actual' })
  async getRate() {
    const amount = await this.repo.findAmount();
    return { amount: amount.amount };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Actualizar tarifa de domicilio' })
  async updateRate(
    @Body() dto: UpdateDeliveryRateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const existing = await this.prisma.deliveryRate.findFirst();
    const rate = existing
      ? await this.prisma.deliveryRate.update({
          where: { id: existing.id },
          data: { amount: dto.amount, updatedBy: user.email },
        })
      : await this.prisma.deliveryRate.create({
          data: { id: crypto.randomUUID(), amount: dto.amount, updatedBy: user.email },
        });
    return { amount: Number(rate.amount) };
  }
}
