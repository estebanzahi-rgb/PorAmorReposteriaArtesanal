import { test, expect } from '@playwright/test';

test.describe('Admin — protección de rutas', () => {
  test('redirige a /login cuando no está autenticado', async ({ page }) => {
    await page.goto('/admin');
    // El layout de admin redirige a /login si no hay sesión
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirige a /login al intentar acceder a /admin/pedidos', async ({ page }) => {
    await page.goto('/admin/pedidos');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirige a /login al intentar acceder a /admin/catalogo', async ({ page }) => {
    await page.goto('/admin/catalogo');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Login page', () => {
  test('muestra botón de login con Google', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/Google/i).or(page.getByRole('button', { name: /Google/i }))).toBeVisible();
  });
});
