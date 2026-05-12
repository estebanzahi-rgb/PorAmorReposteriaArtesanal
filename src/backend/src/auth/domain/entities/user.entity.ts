import { UserRole } from '../value-objects/user-role.vo';

export class User {
  constructor(
    public readonly id: string,
    public readonly googleId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly role: UserRole,
    public readonly photoUrl?: string,
    public readonly createdAt: Date = new Date(),
  ) {}

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  updateRole(role: UserRole): User {
    return new User(this.id, this.googleId, this.email, this.name, role, this.photoUrl, this.createdAt);
  }

  static create(props: {
    id: string;
    googleId: string;
    email: string;
    name: string;
    role?: UserRole;
    photoUrl?: string;
  }): User {
    return new User(
      props.id,
      props.googleId,
      props.email,
      props.name,
      props.role ?? UserRole.USER,
      props.photoUrl,
    );
  }
}
