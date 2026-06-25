import { type Locator, type Page, expect } from '@playwright/test';

/**
 * Page Object covering the cart and the multi-step checkout flow.
 */
export class CheckoutPage {
  private readonly checkoutButton: Locator;
  private readonly firstName: Locator;
  private readonly lastName: Locator;
  private readonly postalCode: Locator;
  private readonly continueButton: Locator;
  private readonly finishButton: Locator;
  private readonly confirmation: Locator;
  private readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
    this.firstName = page.getByPlaceholder('First Name');
    this.lastName = page.getByPlaceholder('Last Name');
    this.postalCode = page.getByPlaceholder('Zip/Postal Code');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.finishButton = page.getByRole('button', { name: 'Finish' });
    this.confirmation = page.getByText('Thank you for your order!');
    this.errorMessage = page.getByTestId('error');
  }

  async expectItemInCart(productName: string): Promise<void> {
    await expect(
      this.page.locator('.cart_item').filter({ hasText: productName }),
    ).toBeVisible();
  }

  async startCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async fillCustomerInfo(
    firstName: string,
    lastName: string,
    postalCode: string,
  ): Promise<void> {
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.postalCode.fill(postalCode);
    await this.continueButton.click();
  }

  /** Click Continue without (necessarily) filling the form — for validation tests. */
  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  async expectError(expected: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(expected);
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  async expectOrderConfirmed(): Promise<void> {
    await expect(this.confirmation).toBeVisible();
    await expect(this.page).toHaveURL(/checkout-complete\.html/);
  }
}
