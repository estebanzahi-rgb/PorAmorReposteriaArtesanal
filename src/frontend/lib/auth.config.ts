import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      const isAdminRoute = path.startsWith('/admin');
      const isProtectedRoute =
        path.startsWith('/checkout') ||
        path.startsWith('/mis-pedidos') ||
        path.startsWith('/pedido') ||
        isAdminRoute;

      if (!isProtectedRoute) return true;
      if (!isLoggedIn) return false;

      if (isAdminRoute && (auth.user as { role?: string })?.role !== 'ADMIN') {
        return Response.redirect(new URL('/', nextUrl));
      }

      return true;
    },
  },
  providers: [],
};
