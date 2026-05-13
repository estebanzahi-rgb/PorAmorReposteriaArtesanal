'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@lib/api';

interface UserDto {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  photoUrl?: string;
}

export function AdminsManager({ initialAdmins }: { initialAdmins: UserDto[] }) {
  const { data: session } = useSession();
  const [admins, setAdmins] = useState<UserDto[]>(initialAdmins);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.backendToken || !searchEmail.trim()) return;
    setSearching(true);
    setError('');
    try {
      const users = await apiFetch<UserDto[]>(`/admin/users?q=${encodeURIComponent(searchEmail.trim())}`, {
        token: session.backendToken,
      });
      setSearchResults(users);
    } catch {
      setError('Error al buscar usuarios');
    } finally {
      setSearching(false);
    }
  };

  const handlePromote = async (userId: string) => {
    if (!session?.backendToken) return;
    setActionLoading(userId);
    setError('');
    try {
      const updated = await apiFetch<UserDto>(`/admin/users/${userId}/promote`, {
        method: 'PATCH',
        token: session.backendToken,
      });
      setAdmins((prev) => [...prev.filter((a) => a.id !== updated.id), updated]);
      setSearchResults((prev) => prev.map((u) => (u.id === updated.id ? { ...u, role: 'ADMIN' } : u)));
    } catch {
      setError('Error al promover usuario');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemote = async (userId: string) => {
    if (!session?.backendToken) return;
    setActionLoading(userId);
    setError('');
    try {
      const updated = await apiFetch<UserDto>(`/admin/users/${userId}/demote`, {
        method: 'PATCH',
        token: session.backendToken,
      });
      setAdmins((prev) => prev.filter((a) => a.id !== updated.id));
      setSearchResults((prev) => prev.map((u) => (u.id === updated.id ? { ...u, role: 'USER' } : u)));
    } catch {
      setError('Error al revocar acceso');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Current admins */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Administradores activos</h2>
        {admins.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay administradores registrados.</p>
        ) : (
          <ul className="divide-y divide-border">
            {admins.map((admin) => (
              <li key={admin.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {admin.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={admin.photoUrl} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{admin.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDemote(admin.id)}
                  disabled={actionLoading === admin.id}
                  className="text-xs px-3 py-1 rounded-md border border-destructive text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {actionLoading === admin.id ? '...' : 'Revocar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Add admin by email search */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Agregar administrador</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Buscar por email..."
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={searching || !searchEmail.trim()}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {searching ? '...' : 'Buscar'}
          </button>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {searchResults.length > 0 && (
          <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {searchResults.map((user) => (
              <li key={user.id} className="px-4 py-3 flex items-center justify-between gap-3 bg-background">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                {user.role === 'ADMIN' ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex-shrink-0">
                    Ya es admin
                  </span>
                ) : (
                  <button
                    onClick={() => handlePromote(user.id)}
                    disabled={actionLoading === user.id}
                    className="text-xs px-3 py-1 rounded-md bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0"
                  >
                    {actionLoading === user.id ? '...' : 'Hacer admin'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
