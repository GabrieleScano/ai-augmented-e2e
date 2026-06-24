import { type Locator, type Page, expect } from '@playwright/test';

/**
 * Page Object for the product inventory screen.
 */
export class InventoryPage {
  private readonly title: Locator;
  private readonly cartBadge: Locator;
  private readonly cartLink: Locator;
  private readonly sortDropdown: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByText('Products');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.sortDropdown = page.getByTestId('product-sort-container');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/inventory\.html/);
    await expect(this.title).toBeVisible();
  }

  /** Add a product to the cart by its display name. */
  async addProductToCart(productName: string): Promise<void> {
    const card = this.page
      .locator('.inventory_item')
      .filter({ hasText: productName });
    await card.getByRole('button', { name: 'Add to cart' }).click();
  }

  async expectCartCount(count: number): Promise<void> {
    if (count === 0) {
      await expect(this.cartBadge).toBeHidden();
      return;
    }
    await expect(this.cartBadge).toHaveText(String(count));
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async sortBy(option: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }
}
