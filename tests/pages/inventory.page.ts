import { type Locator, type Page, expect } from '@playwright/test';

/**
 * Page Object for the product inventory screen.
 */
export class InventoryPage {
  private readonly title: Locator;
  private readonly cartBadge: Locator;
  private readonly cartLink: Locator;
  private readonly sortDropdown: Locator;
  private readonly itemNames: Locator;
  private readonly itemPrices: Locator;
  private readonly menuButton: Locator;
  private readonly logoutLink: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByText('Products');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.sortDropdown = page.getByTestId('product-sort-container');
    this.itemNames = page.locator('.inventory_item_name');
    this.itemPrices = page.locator('.inventory_item_price');
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutLink = page.getByRole('link', { name: 'Logout' });
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

  /** Remove a product from the cart by its display name. */
  async removeProductFromCart(productName: string): Promise<void> {
    const card = this.page
      .locator('.inventory_item')
      .filter({ hasText: productName });
    await card.getByRole('button', { name: 'Remove' }).click();
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

  /** Displayed product names, in current sort order. */
  async productNames(): Promise<string[]> {
    return this.itemNames.allTextContents();
  }

  /** Displayed product prices as numbers, in current sort order. */
  async productPrices(): Promise<number[]> {
    const raw = await this.itemPrices.allTextContents();
    return raw.map((p) => Number(p.replace('$', '')));
  }

  async logout(): Promise<void> {
    await this.menuButton.click();
    await this.logoutLink.click();
  }
}
