import { test, expect } from '@playwright/test';

const ignoreError = (msg: string) =>
  msg.includes('chrome-extension') || msg.includes('Extension');

test.describe('Catálogo público', () => {
  test('carga la página de catálogo sin errores de consola', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');

    expect(errors.filter((e) => !ignoreError(e))).toHaveLength(0);
  });

  test('muestra productos del catálogo', async ({ page }) => {
    await page.goto('/catalogo');
    await expect(page.getByRole('heading', { name: /catálogo/i })).toBeVisible();
    await expect(page.locator('a[href*="/catalogo/"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('navbar está visible', async ({ page }) => {
    await page.goto('/catalogo');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByRole('link', { name: /poramor/i })).toBeVisible();
  });

  test('navega al detalle de producto sin errores de runtime', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');

    // Selector específico a product cards (contienen h3 con el nombre del producto)
    const firstProduct = page.locator('a').filter({ has: page.locator('h3') }).first();
    await expect(firstProduct).toBeVisible({ timeout: 10_000 });
    await firstProduct.click();

    await expect(page).toHaveURL(/\/catalogo\/.+/, { timeout: 8_000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });

    expect(errors.filter((e) => !ignoreError(e))).toHaveLength(0);
  });

  test('imágenes cargan sin error de hostname no configurado', async ({ page }) => {
    const hostnameErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('hostname')) {
        hostnameErrors.push(msg.text());
      }
    });

    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');
    expect(hostnameErrors).toHaveLength(0);
  });
});

test.describe('Página de inicio', () => {
  test('redirige o carga correctamente', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
  });
});
