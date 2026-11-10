import { test, expect } from './fixtures/fixtures.js';
import { onlyInBaselineEnvironment } from '../shared/visual.js';

/**
 * Visual regression for SauceDemo. The catalogue is static, so no mocking is
 * needed; baselines live in tests/saucedemo/__screenshots__/ and are generated
 * in the official Playwright Docker image (see README).
 */

test.beforeEach(() => onlyInBaselineEnvironment());

test.describe('Visual regression', () => {
  test('SAUCE-VIS-001 login page', async ({ loginPage, page }) => {
    await loginPage.goto();
    await expect(page).toHaveScreenshot('login.png');
  });

  test('SAUCE-VIS-002 inventory page', async ({ loggedIn, page }) => {
    await loggedIn.expectLoaded();
    await expect(page).toHaveScreenshot('inventory.png', { fullPage: true });
  });
});
