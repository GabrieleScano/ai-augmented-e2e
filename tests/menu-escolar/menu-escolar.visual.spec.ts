import { test, expect } from './fixtures/fixtures.js';
import { onlyInBaselineEnvironment } from '../shared/visual.js';

/**
 * Visual regression for menu-escolar.
 *
 * Deterministic by construction:
 *  - clock pinned (fixtures.ts), so "today", the week bar and the calendar never move;
 *  - menu data mocked via page.route (menu-data.ts), so dishes never change;
 *  - animations disabled and web fonts awaited before each shot;
 *  - Math.random pinned where the app uses it: on a weekend the toast picks one
 *    of several greetings of different lengths, so it wraps to one or two lines
 *    (MENU-VIS-006). A mask would not help: it hides the text, not the height.
 *
 * Baselines: tests/menu-escolar/__screenshots__/, generated in the official
 * Playwright Docker image (see README).
 */

test.beforeEach(() => onlyInBaselineEnvironment());

test.describe('Visual regression', () => {
  test('MENU-VIS-001 home, basal menu of today', async ({ menu, page }) => {
    await menu.goto();
    await menu.settle();
    await expect(page).toHaveScreenshot('home.png');
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
      await expect(page).toHaveScreenshot('onboarding.png');
    });
  });

  test.describe('on a weekend', () => {
    test.use({ today: '2026-11-07T10:00:00+01:00' }); // Saturday

    test('MENU-VIS-006 weekend home, greeting pinned', async ({ menu, page }) => {
      // The app picks the greeting with Math.random() (its only use). Messages have
      // different lengths, so the toast is one or two lines tall: pin the choice to
      // the first message, which also lets the toast itself be compared.
      await page.addInitScript(() => {
        Math.random = () => 0;
      });
      await menu.goto();
      await expect(menu.weekendToast).toBeVisible();
      await menu.settle();
      await expect(page).toHaveScreenshot('home-weekend.png');
    });
  });
});
