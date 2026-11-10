import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page.js';
import { InventoryPage } from '../pages/inventory.page.js';
import { CheckoutPage } from '../pages/checkout.page.js';
import { users } from './test-data.js';

/**
 * Custom fixtures expose ready-to-use page objects and an
 * "already authenticated" entry point, removing repeated setup
 * from individual specs.
 */
interface Pages {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  checkoutPage: CheckoutPage;
  /** Inventory page reached after logging in as the standard user. */
  loggedIn: InventoryPage;
}

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  loggedIn: async ({ loginPage, inventoryPage }, use) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await inventoryPage.expectLoaded();
    await use(inventoryPage);
  },
});

export { expect } from '@playwright/test';
