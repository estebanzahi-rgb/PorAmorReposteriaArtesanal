import { User } from '../../entities/user.entity';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  photoUrl?: string;
}

// I — Interface Segregation: un caso de uso, una operación
export interface AuthenticateWithGoogleUseCase {
  execute(profile: GoogleProfile): Promise<User>;
}
