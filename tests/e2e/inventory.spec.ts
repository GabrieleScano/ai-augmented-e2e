import { test, expect } from '../fixtures/fixtures.js';
import { products } from '../fixtures/test-data.js';

test.describe('Inventory: sorting and cart', () => {
  test('sorts products by name A to Z', async ({ loggedIn }) => {
    await loggedIn.sortBy('az');
    const names = await loggedIn.productNames();
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  test('sorts products by name Z to A', async ({ loggedIn }) => {
    await loggedIn.sortBy('za');
    const names = await loggedIn.productNames();
    const sorted = [...names].sort((a, b) => b.localeCompare(a));
    expect(names).toEqual(sorted);
  });

  test('sorts products by price low to high', async ({ loggedIn }) => {
    await loggedIn.sortBy('lohi');
    const prices = await loggedIn.productPrices();
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });

  test('sorts products by price high to low', async ({ loggedIn }) => {
    await loggedIn.sortBy('hilo');
    const prices = await loggedIn.productPrices();
    const sorted = [...prices].sort((a, b) => b - a);
    expect(prices).toEqual(sorted);
  });

  test('adding then removing a product clears the cart badge', async ({ loggedIn }) => {
    await loggedIn.addProductToCart(products.backpack.name);
    await loggedIn.expectCartCount(1);

    await loggedIn.removeProductFromCart(products.backpack.name);
    await loggedIn.expectCartCount(0);
  });
});

test.describe('Inventory: session', () => {
  test('logs out back to the login screen', async ({ loggedIn, loginPage }) => {
    await loggedIn.logout();
    await loginPage.expectLoaded();
  });
});
