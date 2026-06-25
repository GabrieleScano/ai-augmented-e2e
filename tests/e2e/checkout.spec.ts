import { test } from '../fixtures/fixtures.js';
import { products } from '../fixtures/test-data.js';

test.describe('Shopping cart and checkout', () => {
  test('should complete a purchase end to end', async ({
    loggedIn,
    checkoutPage,
  }) => {
    await loggedIn.addProductToCart(products.backpack.name);
    await loggedIn.expectCartCount(1);
    await loggedIn.openCart();

    await checkoutPage.expectItemInCart(products.backpack.name);
    await checkoutPage.startCheckout();
    await checkoutPage.fillCustomerInfo('Gabriele', 'Scano', '08001');
    await checkoutPage.finish();
    await checkoutPage.expectOrderConfirmed();
  });

  test('should reflect multiple items in the cart badge', async ({
    loggedIn,
  }) => {
    await loggedIn.addProductToCart(products.backpack.name);
    await loggedIn.addProductToCart(products.bikeLight.name);
    await loggedIn.expectCartCount(2);
  });

  test('should require customer information before continuing', async ({
    loggedIn,
    checkoutPage,
  }) => {
    await loggedIn.addProductToCart(products.backpack.name);
    await loggedIn.openCart();
    await checkoutPage.startCheckout();

    // Continue without filling the form.
    await checkoutPage.continue();
    await checkoutPage.expectError('First Name is required');
  });
});
