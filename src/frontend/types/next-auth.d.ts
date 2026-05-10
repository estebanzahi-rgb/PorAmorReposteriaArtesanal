import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    backendToken: string;
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    backendToken?: string;
    userId?: string;
    role?: string;
  }
}
