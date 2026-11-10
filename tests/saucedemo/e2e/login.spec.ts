import { test } from '../fixtures/fixtures.js';
import { users } from '../fixtures/test-data.js';

test.describe('Authentication', () => {
  test('SAUCE-E2E-001 should log in successfully with valid standard credentials', async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await inventoryPage.expectLoaded();
  });

  test('SAUCE-E2E-002 should block a locked-out user with a clear error', async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(users.lockedOut.username, users.lockedOut.password);
    await loginPage.expectError('locked out');
  });

  test('SAUCE-E2E-003 should block direct access to a protected page when not logged in', async ({
    page,
    loginPage,
  }) => {
    await page.goto('/inventory.html');
    await loginPage.expectError("You can only access '/inventory.html'");
  });

  // Data-driven: one behaviour ("invalid input is rejected with the right
  // message") exercised across several input combinations.
  const invalidCases = [
    { id: 'SAUCE-E2E-004', name: 'wrong username and password', username: 'ghost_user', password: 'nope', error: 'do not match' },
    { id: 'SAUCE-E2E-005', name: 'missing username', username: '', password: users.standard.password, error: 'Username is required' },
    { id: 'SAUCE-E2E-006', name: 'missing password', username: users.standard.username, password: '', error: 'Password is required' },
    { id: 'SAUCE-E2E-007', name: 'empty form', username: '', password: '', error: 'Username is required' },
  ];

  for (const tc of invalidCases) {
    test(`${tc.id} should reject login: ${tc.name}`, async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(tc.username, tc.password);
      await loginPage.expectError(tc.error);
    });
  }
});
