import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      if (account?.provider === 'google' && user?.email) {
        const res = await fetch(`${process.env.API_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            googleId: account.providerAccountId,
            email: user.email,
            name: user.name,
            image: user.image,
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as { accessToken: string; user: { id: string; role: string } };
          token.backendToken = data.accessToken;
          token.userId = data.user.id;
          token.role = data.user.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken as string;
      session.user.id = token.userId as string;
      (session.user as { role?: string }).role = token.role as string;
      return session;
    },
  },
  session: { strategy: 'jwt' },
});
