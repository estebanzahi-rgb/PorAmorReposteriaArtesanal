import { User } from '../../entities/user.entity';
import { UserRole } from '../../value-objects/user-role.vo';

// D — Dependency Inversion: el dominio define la interfaz; la infra la implementa
export interface UserRepository {
  findByGoogleId(googleId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(emailSearch?: string): Promise<User[]>;
  updateRole(userId: string, role: UserRole): Promise<User>;
  save(user: User): Promise<User>;
}
