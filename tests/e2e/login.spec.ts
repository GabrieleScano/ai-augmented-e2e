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

  test('should block direct access to a protected page when not logged in', async ({
    page,
    loginPage,
  }) => {
    await page.goto('/inventory.html');
    await loginPage.expectError("You can only access '/inventory.html'");
  });

  // Data-driven: one behaviour ("invalid input is rejected with the right
  // message") exercised across several input combinations.
  const invalidCases = [
    { name: 'wrong username and password', username: 'ghost_user', password: 'nope', error: 'do not match' },
    { name: 'missing username', username: '', password: users.standard.password, error: 'Username is required' },
    { name: 'missing password', username: users.standard.username, password: '', error: 'Password is required' },
    { name: 'empty form', username: '', password: '', error: 'Username is required' },
  ];

  for (const tc of invalidCases) {
    test(`should reject login: ${tc.name}`, async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(tc.username, tc.password);
      await loginPage.expectError(tc.error);
    });
  }
});
