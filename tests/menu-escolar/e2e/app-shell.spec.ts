import { test, expect } from '../fixtures/fixtures.js';
import { lunchOn } from '../fixtures/menu-data.js';

/**
 * App shell: language, sharing, first-visit onboarding and cookie consent.
 * Notifications are deliberately NOT covered: saving them writes push tags
 * for a real device (see fixtures.ts).
 */

test.describe('App shell', () => {
  test('MENU-E2E-010 switching language translates the UI and is remembered', async ({ menu, page }) => {
    await menu.goto();
    const lunchTitle = menu.slide(4).locator('.meal-section.lunch .m-txt');
    await expect(lunchTitle).toHaveText('Dinar');

    await menu.setLanguage('es');
    await menu.closeSheets();
    await expect(lunchTitle).toHaveText('Comida');
    await expect(menu.backToToday).toHaveText('Volver a hoy');

    await menu.setLanguage('en');
    await menu.closeSheets();
    await expect(lunchTitle).toHaveText('Lunch');

    await page.reload();
    await expect(menu.slide(4).locator('.meal-section.lunch .m-txt')).toHaveText('Lunch');
  });

  test('MENU-E2E-012 sharing builds the day summary without sharing anything for real', async ({ menu, page }) => {
    // Stub the Web Share API: capture the payload instead of opening a share sheet.
    await page.addInitScript(() => {
      (window as unknown as { __shared: unknown[] }).__shared = [];
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (data: unknown) => {
          (window as unknown as { __shared: unknown[] }).__shared.push(data);
        },
      });
    });
    await menu.goto();

    await menu.tab(/Compartir/).click();

    const shared = await page.evaluate(() => (window as unknown as { __shared: Array<{ text: string }> }).__shared);
    expect(shared).toHaveLength(1);
    const text = shared[0]!.text;
    expect(text).toMatch(/^Menú Basal · Dimecres 4 de novembre/);
    for (const dish of lunchOn(4)) expect(text).toContain(dish);
    expect(text).toContain('https://menu-escolar-poble-sec-i62w.vercel.app/');
  });

  test.describe('on a first visit', () => {
    test.use({ returningVisitor: false });

    test('MENU-E2E-013 onboarding is shown once and "Salta" dismisses it for good', async ({ menu, page }) => {
      await menu.goto();
      const dialog = page.getByRole('dialog', { name: 'Hola, famílies!' });
      await expect(dialog).toBeVisible();

      await dialog.getByRole('button', { name: 'Salta' }).click();
      await expect(menu.onboarding).toBeHidden();

      await page.reload();
      await expect(menu.selectedPill).toBeVisible();
      await expect(menu.onboarding).toBeHidden();
    });

    test('MENU-E2E-014 rejecting analytics cookies is remembered', async ({ menu, page }) => {
      await menu.goto();
      await page.getByRole('dialog', { name: 'Hola, famílies!' }).getByRole('button', { name: 'Salta' }).click();

      await expect(menu.cookieBanner).toBeVisible();
      await menu.cookieBanner.getByRole('button', { name: 'Rebutjar' }).click();
      await expect(menu.cookieBanner).toBeHidden();
      expect(await page.evaluate(() => localStorage.getItem('menu_escolar_cookies_accepted'))).toBe('false');

      await page.reload();
      await expect(menu.selectedPill).toBeVisible();
      await expect(menu.cookieBanner).toBeHidden();
    });
  });
});
