import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/interfaces/http/guards/roles.guard';
import { Roles } from '../../../auth/interfaces/http/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/interfaces/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/interfaces/http/types/authenticated-user';
import {
  GET_STORE_SETTINGS_USE_CASE,
  UPDATE_STORE_SETTINGS_USE_CASE,
} from '../../store-config.tokens';
import { GetStoreSettingsUseCase } from '../../domain/ports/in/get-store-settings.use-case';
import { UpdateStoreSettingsUseCase } from '../../domain/ports/in/update-store-settings.use-case';
import { UpdateStoreSettingsDto } from '../../application/dtos/update-store-settings.dto';

@ApiTags('store-settings')
@Controller()
export class AdminStoreSettingsController {
  constructor(
    @Inject(GET_STORE_SETTINGS_USE_CASE) private readonly getSettings: GetStoreSettingsUseCase,
    @Inject(UPDATE_STORE_SETTINGS_USE_CASE) private readonly updateSettings: UpdateStoreSettingsUseCase,
  ) {}

  @Get('store-settings')
  @ApiOperation({ summary: 'Obtener configuración de tienda (público)' })
  async getPublic() {
    const settings = await this.getSettings.execute();
    return { leadTimeHours: settings.leadTime.value };
  }

  @Get('admin/store-settings')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] Obtener configuración de tienda' })
  async get() {
    const settings = await this.getSettings.execute();
    return {
      leadTimeHours: settings.leadTime.value,
      updatedAt: settings.updatedAt.toISOString(),
      updatedBy: settings.updatedBy,
    };
  }

  @Put('admin/store-settings')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Actualizar antelación mínima' })
  async update(
    @Body() dto: UpdateStoreSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const settings = await this.updateSettings.execute({
      leadTimeHours: dto.leadTimeHours,
      updatedBy: user.email,
    });
    return {
      leadTimeHours: settings.leadTime.value,
      updatedAt: settings.updatedAt.toISOString(),
      updatedBy: settings.updatedBy,
    };
  }
}
