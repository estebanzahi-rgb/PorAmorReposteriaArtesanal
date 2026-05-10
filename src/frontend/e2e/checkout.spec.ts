import { test, expect } from '@playwright/test';

test.describe('Checkout — usuario no autenticado', () => {
  test('muestra mensaje de login requerido en /checkout', async ({ page }) => {
    await page.goto('/checkout');
    // Unauthenticated users see a login prompt (not a hard redirect)
    const content = page.locator('main').first();
    await expect(content).toBeVisible({ timeout: 10_000 });
    // Should show login prompt text
    await expect(
      page.getByText(/inicia sesión|login|accede/i).or(page.getByRole('link', { name: /login/i })),
    ).toBeVisible();
  });
});

test.describe('Mis pedidos — usuario no autenticado', () => {
  test('redirige a /login desde /mis-pedidos', async ({ page }) => {
    await page.goto('/mis-pedidos');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Flujo de producto a carrito (anonimo)', () => {
  test('puede ver detalle de producto y tiene botón de añadir', async ({ page }) => {
    // First go to catalog to find a product link
    await page.goto('/catalogo');
    const productLinks = page.locator('a[href*="/catalogo/"]');
    const count = await productLinks.count();

    // Only proceed if there are products (dev environment may have seed data)
    if (count > 0) {
      await productLinks.first().click();
      await expect(page).toHaveURL(/\/catalogo\/.+/);
      // Detail page should show a button to add to cart or configure
      await expect(
        page.getByRole('button', { name: /carrito|agregar|añadir|configurar/i }),
      ).toBeVisible({ timeout: 10_000 });
    } else {
      test.skip();
    }
  });
});
