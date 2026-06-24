import { type Locator, type Page, expect } from '@playwright/test';

/**
 * Page Object for the SauceDemo login screen.
 *
 * Locators are private; only intent-revealing actions are exposed.
 * Uses semantic locators (placeholder/role) rather than brittle selectors.
 */
export class LoginPage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.getByPlaceholder('Username');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByTestId('error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await expect(this.loginButton).toBeVisible();
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectError(expected: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(expected);
  }
}
