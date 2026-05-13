import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './interfaces/http/auth.controller';
import { AdminUserController } from './interfaces/http/admin-user.controller';
import { AuthenticateWithGoogleImpl } from './application/use-cases/authenticate-with-google.impl';
import { UserPrismaRepository } from './infrastructure/persistence/user.prisma.repository';
import { JwtStrategy } from './infrastructure/adapters/jwt.strategy';
import { USER_REPOSITORY, AUTHENTICATE_WITH_GOOGLE_USE_CASE } from './auth.tokens';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, AdminUserController],
  providers: [
    { provide: USER_REPOSITORY, useClass: UserPrismaRepository },
    { provide: AUTHENTICATE_WITH_GOOGLE_USE_CASE, useClass: AuthenticateWithGoogleImpl },
    JwtStrategy,
  ],
  exports: [JwtModule, JwtStrategy],
})
export class AuthModule {}
