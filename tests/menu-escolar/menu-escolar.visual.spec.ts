import { test, expect } from './fixtures/fixtures.js';
import { onlyInBaselineEnvironment } from '../shared/visual.js';

/**
 * Visual regression for menu-escolar.
 *
 * Deterministic by construction:
 *  - clock pinned (fixtures.ts), so "today", the week bar and the calendar never move;
 *  - menu data mocked via page.route (menu-data.ts), so dishes never change;
 *  - animations disabled and web fonts awaited before each shot;
 *  - what can still vary is masked: the weekend toast picks a random message.
 *
 * Baselines: tests/menu-escolar/__screenshots__/, generated in the official
 * Playwright Docker image (see README).
 */

test.beforeEach(() => onlyInBaselineEnvironment());

test.describe('Visual regression', () => {
  test('MENU-VIS-001 home, basal menu of today', async ({ menu, page }) => {
    await menu.goto();
    await menu.settle();
    await expect(page).toHaveScreenshot('home.png', { mask: [menu.weekendToast] });
  });

  test('MENU-VIS-002 menu-type sheet', async ({ menu, page }) => {
    await menu.goto();
    await menu.openMenuTypes();
    await menu.settle();
    await expect(page).toHaveScreenshot('menu-types-sheet.png');
  });

  test('MENU-VIS-003 allergen legend sheet', async ({ menu, page }) => {
    await menu.goto();
    await menu.openAllergens();
    await menu.settle();
    await expect(page).toHaveScreenshot('allergens-sheet.png');
  });

  test('MENU-VIS-004 calendar sheet', async ({ menu, page }) => {
    await menu.goto();
    await menu.openCalendar();
    await menu.settle();
    await expect(page).toHaveScreenshot('calendar-sheet.png');
  });

  test.describe('on a first visit', () => {
    test.use({ returningVisitor: false });

    test('MENU-VIS-005 onboarding, first step', async ({ menu, page }) => {
      await menu.goto();
      await page.getByRole('dialog', { name: 'Hola, famílies!' }).waitFor();
      await menu.settle();
      await expect(page).toHaveScreenshot('onboarding.png', { mask: [menu.cookieBanner] });
    });
  });
});
