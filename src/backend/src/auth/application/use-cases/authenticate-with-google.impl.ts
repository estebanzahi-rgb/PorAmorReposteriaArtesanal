import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import {
  AuthenticateWithGoogleUseCase,
  GoogleProfile,
} from '../../domain/ports/in/authenticate-with-google.use-case';
import { UserRepository } from '../../domain/ports/out/user.repository';
import { USER_REPOSITORY } from '../../auth.tokens';

@Injectable()
export class AuthenticateWithGoogleImpl implements AuthenticateWithGoogleUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(profile: GoogleProfile): Promise<User> {
    const adminEmails = this.config
      .get<string>('ADMIN_EMAILS', '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    const expectedRole = adminEmails.includes(profile.email) ? UserRole.ADMIN : UserRole.USER;

    let user = await this.userRepo.findByGoogleId(profile.googleId);
    if (!user) {
      user = await this.userRepo.findByEmail(profile.email);
    }

    if (!user) {
      return this.userRepo.save(
        User.create({
          id: crypto.randomUUID(),
          googleId: profile.googleId,
          email: profile.email,
          name: profile.name,
          role: expectedRole,
          photoUrl: profile.photoUrl,
        }),
      );
    }

    if (user.role !== expectedRole) {
      user.updateRole(expectedRole);
      return this.userRepo.save(user);
    }

    return user;
  }
}
