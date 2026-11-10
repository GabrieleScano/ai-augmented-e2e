import { test } from './fixtures/fixtures.js';
import { expectNoA11yViolations } from '../shared/a11y.js';

/**
 * WCAG 2 A/AA checks (axe) on every screen of menu-escolar.
 * Known violations are documented, with reason and fix, in
 * tests/shared/a11y-allowlist.ts.
 */

test.describe('Accessibility (WCAG 2 A/AA)', () => {
  test('MENU-A11Y-001 home: day view of today', async ({ menu, page }) => {
    await menu.goto();
    await expectNoA11yViolations(page, 'menu-escolar/home');
  });

  test('MENU-A11Y-002 menu-type sheet', async ({ menu, page }) => {
    await menu.goto();
    await menu.openMenuTypes();
    await expectNoA11yViolations(page, 'menu-escolar/menu-types');
  });

  test('MENU-A11Y-003 allergen legend sheet', async ({ menu, page }) => {
    await menu.goto();
    await menu.openAllergens();
    await expectNoA11yViolations(page, 'menu-escolar/allergens');
  });

  test('MENU-A11Y-004 calendar sheet', async ({ menu, page }) => {
    await menu.goto();
    await menu.openCalendar();
    await expectNoA11yViolations(page, 'menu-escolar/calendar');
  });

  test('MENU-A11Y-005 "Més" sheet', async ({ menu, page }) => {
    await menu.goto();
    await menu.openMore();
    await expectNoA11yViolations(page, 'menu-escolar/more');
  });

  test.describe('on a first visit', () => {
    test.use({ returningVisitor: false });

    test('MENU-A11Y-006 onboarding dialog', async ({ menu, page }) => {
      await menu.goto();
      await page.getByRole('dialog', { name: 'Hola, famílies!' }).waitFor();
      // Scope to the dialog: the home behind it is covered by MENU-A11Y-001.
      await expectNoA11yViolations(page, 'menu-escolar/onboarding', '#obOverlay');
    });
  });
});
