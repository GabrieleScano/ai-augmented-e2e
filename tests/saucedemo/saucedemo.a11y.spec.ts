import { test } from './fixtures/fixtures.js';
import { expectNoA11yViolations } from '../shared/a11y.js';

/**
 * WCAG 2 A/AA checks (axe) on SauceDemo's main screens.
 * No known violations at the time of writing; any new one fails the test and
 * must be fixed upstream or documented in tests/shared/a11y-allowlist.ts.
 */

test.describe('Accessibility (WCAG 2 A/AA)', () => {
  test('SAUCE-A11Y-001 login page', async ({ loginPage, page }) => {
    await loginPage.goto();
    await expectNoA11yViolations(page, 'saucedemo/login');
  });

  test('SAUCE-A11Y-002 inventory page', async ({ loggedIn, page }) => {
    await loggedIn.expectLoaded();
    await expectNoA11yViolations(page, 'saucedemo/inventory');
  });
});
