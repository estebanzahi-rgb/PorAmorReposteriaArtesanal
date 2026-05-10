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
    let user = await this.userRepo.findByGoogleId(profile.googleId);

    if (!user) {
      user = await this.userRepo.findByEmail(profile.email);
    }

    if (!user) {
      const adminEmails = this.config
        .get<string>('ADMIN_EMAILS', '')
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

      const role = adminEmails.includes(profile.email) ? UserRole.ADMIN : UserRole.USER;

      const newUser = User.create({
        id: crypto.randomUUID(),
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        role,
        photoUrl: profile.photoUrl,
      });

      return this.userRepo.save(newUser);
    }

    return user;
  }
}
