import { test, expect } from './fixtures/fixtures.js';
import { onlyInBaselineEnvironment } from '../shared/visual.js';

/**
 * Visual regression for menu-escolar.
 *
 * Deterministic by construction:
 *  - clock pinned (fixtures.ts), so "today", the week bar and the calendar never move;
 *  - menu data mocked via page.route (menu-data.ts), so dishes never change;
 *  - animations disabled and web fonts awaited before each shot;
 *  - what still varies is masked, and only where it is actually on screen:
 *    on a weekend the toast shows one of several random messages (MENU-VIS-006).
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

    test('MENU-VIS-006 weekend home, random greeting masked', async ({ menu, page }) => {
      await menu.goto();
      await expect(menu.weekendToast).toBeVisible();
      await menu.settle();
      // The greeting is picked with Math.random(): mask the text, keep the rest of the screen.
      await expect(page).toHaveScreenshot('home-weekend.png', { mask: [menu.weekendToast] });
    });
  });
});
