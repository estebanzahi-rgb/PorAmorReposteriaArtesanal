const CLIENT_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const SERVER_API_URL = process.env.API_URL ?? 'http://localhost:3001/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const { token, ...rest } = options ?? {};
  const res = await fetch(`${CLIENT_API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
  });
  return handleResponse<T>(res);
}

export async function serverFetch<T>(
  path: string,
  options?: RequestInit & { token?: string; timeoutMs?: number },
): Promise<T> {
  const { token, timeoutMs = 8000, ...rest } = options ?? {};
  const res = await fetch(`${SERVER_API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });
  return handleResponse<T>(res);
}
