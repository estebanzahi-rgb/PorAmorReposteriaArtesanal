import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { UserRepository } from '../../domain/ports/out/user.repository';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import type { User as PrismaUser } from '@prisma/client';

@Injectable()
export class UserPrismaRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByGoogleId(googleId: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { googleId } });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? this.toDomain(record) : null;
  }

  async findAll(emailSearch?: string): Promise<User[]> {
    const records = await this.prisma.user.findMany({
      where: emailSearch ? { email: { contains: emailSearch, mode: 'insensitive' } } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async updateRole(userId: string, role: UserRole): Promise<User> {
    const record = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    return this.toDomain(record);
  }

  async save(user: User): Promise<User> {
    const record = await this.prisma.user.upsert({
      where: { googleId: user.googleId },
      create: {
        id: user.id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        role: user.role,
        photoUrl: user.photoUrl,
      },
      update: {
        name: user.name,
        photoUrl: user.photoUrl,
      },
    });
    return this.toDomain(record);
  }

  private toDomain(record: PrismaUser): User {
    return new User(
      record.id,
      record.googleId,
      record.email,
      record.name,
      record.role as UserRole,
      record.photoUrl ?? undefined,
      record.createdAt,
    );
  }
}
