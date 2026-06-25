import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration.
 *
 * Tests run against the public SauceDemo application, a stable demo
 * e-commerce site widely used for automation practice.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests within a file in parallel. */
  fullyParallel: true,
  /* Fail the build on CI if test.only is left in the source. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only to absorb transient network flakiness. */
  retries: process.env.CI ? 2 : 0,
  /* Limit workers on CI for stable, reproducible runs. */
  workers: process.env.CI ? 2 : undefined,
  /*
   * Reporters: locally, list + HTML + Allure. On CI we emit a `blob` report
   * per browser so the matrix shards can be merged into a single HTML report
   * and published to GitHub Pages.
   */
  reporter: process.env.CI
    ? [['blob'], ['allure-playwright']]
    : [['list'], ['html', { open: 'never' }], ['allure-playwright']],
  /* Shared settings for all projects. */
  use: {
    baseURL: 'https://www.saucedemo.com',
    /* SauceDemo exposes test hooks via `data-test`, not the Playwright default `data-testid`. */
    testIdAttribute: 'data-test',
    /* Collect trace on first retry to debug failures without bloating runs. */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  /* Sensible global expect timeout for web-first assertions. */
  expect: {
    timeout: 7_000,
  },
  projects: [
    /* Pure-logic unit tests (AI response parser) — no browser. */
    {
      name: 'unit',
      testMatch: /tests\/unit\/.*\.spec\.ts/,
    },
    /* Cross-browser E2E coverage. */
    {
      name: 'chromium',
      testMatch: /tests\/e2e\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testMatch: /tests\/e2e\/.*\.spec\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testMatch: /tests\/e2e\/.*\.spec\.ts/,
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
