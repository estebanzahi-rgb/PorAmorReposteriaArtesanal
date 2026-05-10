import { User } from '../../entities/user.entity';

// D — Dependency Inversion: el dominio define la interfaz; la infra la implementa
export interface UserRepository {
  findByGoogleId(googleId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
}
