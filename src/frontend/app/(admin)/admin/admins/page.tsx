import { auth } from '@lib/auth';
import { serverFetch } from '@lib/api';
import { AdminsManager } from './admins-manager';

interface UserDto {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  photoUrl?: string;
}

export default async function AdminsPage() {
  const session = await auth();

  let allAdmins: UserDto[] = [];
  try {
    const users = await serverFetch<UserDto[]>('/admin/users', { token: session!.backendToken });
    allAdmins = users.filter((u) => u.role === 'ADMIN');
  } catch {
    allAdmins = [];
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--brand-brown))]">Administradores</h1>
      <p className="text-sm text-muted-foreground">
        Gestiona quién tiene acceso al panel de administración. Busca un usuario por correo para
        agregarlo como administrador.
      </p>
      <AdminsManager initialAdmins={allAdmins} />
    </div>
  );
}
