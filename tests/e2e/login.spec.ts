import { test } from '../fixtures/fixtures.js';
import { users } from '../fixtures/test-data.js';

test.describe('Authentication', () => {
  test('should log in successfully with valid standard credentials', async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await inventoryPage.expectLoaded();
  });

  test('should block a locked-out user with a clear error', async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(users.lockedOut.username, users.lockedOut.password);
    await loginPage.expectError('locked out');
  });

  test('should reject login when the password is missing', async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, '');
    await loginPage.expectError('Password is required');
  });

  test('should reject login with invalid credentials', async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.login('ghost_user', 'wrong_password');
    await loginPage.expectError('do not match');
  });
});
