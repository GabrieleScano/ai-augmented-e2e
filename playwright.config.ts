import { defineConfig, devices } from '@playwright/test';

/**
 * Multi-SUT Playwright configuration.
 *
 * One project per system under test (and per browser where it adds value):
 *
 *   unit                    pure logic (AI parser, framework guards), no browser
 *   saucedemo-chromium      SauceDemo demo shop, desktop. Also runs visual + a11y.
 *   saucedemo-firefox       functional only
 *   saucedemo-webkit        functional only
 *   menu-escolar-chromium   menu-escolar PWA (production), Pixel 7. Also visual + a11y.
 *   menu-escolar-webkit     functional only, iPhone 13
 *
 * Visual specs (*.visual.spec.ts) and accessibility specs (*.a11y.spec.ts) run
 * on Chromium only: one baseline set per SUT, generated in the official
 * Playwright Docker image (see README, "Visual regression").
 *
 * @see https://playwright.dev/docs/test-configuration
 */

const SAUCEDEMO_URL = 'https://www.saucedemo.com';
const MENU_ESCOLAR_URL = 'https://menu-escolar-poble-sec-i62w.vercel.app';

const NOT_VISUAL_OR_A11Y = [/\.visual\.spec\.ts$/, /\.a11y\.spec\.ts$/];

/** Shared by both menu-escolar projects: it is a production app used by families. */
const menuEscolar = {
  testDir: './tests/menu-escolar',
  /* Gentle on production: one browser page at a time per project, no extra retries. */
  workers: 1,
  retries: process.env.CI ? 1 : 0,
} as const;

const menuEscolarUse = {
  baseURL: MENU_ESCOLAR_URL,
  locale: 'ca-ES',
  timezoneId: 'Europe/Madrid',
  /* No service-worker cache between tests (and no push-subscription plumbing). */
  serviceWorkers: 'block',
} as const;

export default defineConfig({
  /* Run tests within a file in parallel (menu-escolar is capped by its project `workers`). */
  fullyParallel: true,
  /* Fail the build on CI if test.only is left in the source. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only to absorb transient network flakiness. */
  retries: process.env.CI ? 2 : 0,
  /* Limit workers on CI for stable, reproducible runs. */
  workers: process.env.CI ? 2 : undefined,
  /*
   * Reporters: locally, list + HTML + Allure. On CI we emit a `blob` report
   * per job so they can be merged into a single HTML report and published to
   * GitHub Pages. In both cases the test-triage-kit reporter writes a
   * normalized triage-input.json consumed by `npx triage`.
   */
  reporter: process.env.CI
    ? [
        /* Unique file per CI job (BLOB_NAME), so merge-multiple never overwrites one with another. */
        ['blob', { fileName: `report-${process.env.BLOB_NAME ?? 'ci'}.zip` }],
        ['allure-playwright'],
        ['test-triage-kit/reporter', { outputFile: 'triage-input.json' }],
      ]
    : [
        ['list'],
        ['html', { open: 'never' }],
        ['allure-playwright'],
        ['test-triage-kit/reporter', { outputFile: 'triage-input.json' }],
      ],
  /*
   * Baselines live next to each SUT, one file per screenshot. No platform
   * suffix on purpose: the only valid baselines are the Linux ones produced in
   * the CI Docker image (visual specs skip themselves elsewhere).
   */
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  /* Shared settings for all projects. */
  use: {
    /* Collect trace on first retry to debug failures without bloating runs. */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  expect: {
    /* Sensible global expect timeout for web-first assertions. */
    timeout: 7_000,
    toHaveScreenshot: {
      /* Absorb sub-pixel anti-aliasing only; real layout changes still fail. */
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  projects: [
    /* Pure-logic unit tests: no browser, no network. */
    {
      name: 'unit',
      testDir: './tests/unit',
    },

    /* ── SUT 1: SauceDemo (public demo shop) ─────────────────────────── */
    {
      name: 'saucedemo-chromium',
      testDir: './tests/saucedemo',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: SAUCEDEMO_URL,
        /* SauceDemo exposes test hooks via `data-test`, not the default `data-testid`. */
        testIdAttribute: 'data-test',
      },
    },
    {
      name: 'saucedemo-firefox',
      testDir: './tests/saucedemo',
      testIgnore: NOT_VISUAL_OR_A11Y,
      use: { ...devices['Desktop Firefox'], baseURL: SAUCEDEMO_URL, testIdAttribute: 'data-test' },
    },
    {
      name: 'saucedemo-webkit',
      testDir: './tests/saucedemo',
      testIgnore: NOT_VISUAL_OR_A11Y,
      use: { ...devices['Desktop Safari'], baseURL: SAUCEDEMO_URL, testIdAttribute: 'data-test' },
    },

    /* ── SUT 2: menu-escolar (production PWA, mobile-first) ──────────── */
    {
      name: 'menu-escolar-chromium',
      ...menuEscolar,
      use: { ...devices['Pixel 7'], ...menuEscolarUse },
    },
    {
      name: 'menu-escolar-webkit',
      ...menuEscolar,
      testIgnore: NOT_VISUAL_OR_A11Y,
      use: { ...devices['iPhone 13'], ...menuEscolarUse },
    },
  ],
});
