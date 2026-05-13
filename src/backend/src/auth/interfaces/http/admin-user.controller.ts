import { Controller, Get, Inject, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { USER_REPOSITORY } from '../../auth.tokens';
import { UserRepository } from '../../domain/ports/out/user.repository';
import { UserRole } from '../../domain/value-objects/user-role.vo';

@ApiTags('admin-users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/users')
export class AdminUserController {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: UserRepository) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Listar usuarios' })
  async listUsers(@Query('q') q?: string) {
    const users = await this.userRepo.findAll(q);
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      photoUrl: u.photoUrl,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  @Patch(':id/promote')
  @ApiOperation({ summary: '[Admin] Promover usuario a ADMIN' })
  async promote(@Param('id') id: string) {
    const user = await this.userRepo.updateRole(id, UserRole.ADMIN);
    return { id: user.id, email: user.email, role: user.role };
  }

  @Patch(':id/demote')
  @ApiOperation({ summary: '[Admin] Revocar rol ADMIN de usuario' })
  async demote(@Param('id') id: string) {
    const user = await this.userRepo.updateRole(id, UserRole.USER);
    return { id: user.id, email: user.email, role: user.role };
  }
}
