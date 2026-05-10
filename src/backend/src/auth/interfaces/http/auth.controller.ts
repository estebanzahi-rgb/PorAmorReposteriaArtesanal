import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import {
  AuthenticateWithGoogleUseCase,
} from '../../domain/ports/in/authenticate-with-google.use-case';
import { AUTHENTICATE_WITH_GOOGLE_USE_CASE } from '../../auth.tokens';
import { GoogleAuthDto } from './dtos/google-auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTHENTICATE_WITH_GOOGLE_USE_CASE)
    private readonly authenticateWithGoogle: AuthenticateWithGoogleUseCase,
    private readonly jwtService: JwtService,
  ) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica con perfil de Google, retorna JWT del backend' })
  async googleAuth(@Body() dto: GoogleAuthDto) {
    const user = await this.authenticateWithGoogle.execute({
      googleId: dto.googleId,
      email: dto.email,
      name: dto.name,
      photoUrl: dto.image,
    });

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        photoUrl: user.photoUrl,
      },
    };
  }
}
