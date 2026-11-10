import { test as base, expect } from '@playwright/test';
import { MenuPage } from '../pages/menu.page.js';
import { monthScript } from './menu-data.js';

/**
 * Fixtures for menu-escolar, a PRODUCTION app used by real families.
 *
 * Safety rules enforced here for every test (not left to each spec):
 *  - Read-only: any request that is not GET/HEAD/OPTIONS is aborted and fails
 *    the test, and /api/* (the app's only write endpoint, push-notification
 *    tags) is never reachable.
 *  - No side effects on real users' data: Google Analytics and OneSignal are
 *    blocked, so test runs neither pollute analytics nor create push
 *    subscriptions. The service worker is blocked in the project config.
 *
 * Determinism:
 *  - The clock is pinned (option `today`), because the app picks the day to
 *    show from `new Date()`.
 *  - menus/AAAA-MM.js are served from ./menu-data.ts instead of the live menu.
 */

/** Wednesday 4 November 2026, 10:00 in Barcelona: a normal school day. */
export const DEFAULT_TODAY = '2026-11-04T10:00:00+01:00';

interface MenuOptions {
  /** Instant the app sees as "now". */
  today: string;
  /** false = first visit (onboarding + cookie banner are shown). */
  returningVisitor: boolean;
}

interface MenuFixtures {
  menu: MenuPage;
  /** Requests the guard blocked because they would have written data. */
  blockedWrites: string[];
}

const TRACKERS = /googletagmanager\.com|google-analytics\.com|onesignal\.com/i;

export const test = base.extend<MenuOptions & MenuFixtures>({
  today: [DEFAULT_TODAY, { option: true }],
  returningVisitor: [true, { option: true }],

  blockedWrites: [
    async ({ context }, use) => {
      const blocked: string[] = [];

      await context.route(TRACKERS, (route) => route.abort());
      await context.route('**/api/**', (route) => {
        blocked.push(`${route.request().method()} ${route.request().url()}`);
        return route.abort();
      });
      await context.route('**/*', (route) => {
        const method = route.request().method();
        if (TRACKERS.test(route.request().url())) return route.abort(); // beacons are not app writes
        if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return route.fallback();
        blocked.push(`${method} ${route.request().url()}`);
        return route.abort();
      });
      // Registered last = matched first: serve the fixture months.
      await context.route('**/menus/*.js', (route) => {
        const key = new URL(route.request().url()).pathname.match(/(\d{4}-\d{2})\.js$/)?.[1] ?? '';
        return route.fulfill({ contentType: 'application/javascript', body: monthScript(key) });
      });

      await use(blocked);

      expect(blocked, 'the suite must never write to the production app').toEqual([]);
    },
    { auto: true },
  ],

  page: async ({ page, today, returningVisitor }, use) => {
    await page.clock.setFixedTime(new Date(today));
    if (returningVisitor) {
      await page.addInitScript(() => {
        localStorage.setItem('menu_escolar_onboarding_done', '1');
        localStorage.setItem('menu_escolar_cookies_accepted', 'false');
      });
    }
    await use(page);
  },

  menu: async ({ page }, use) => {
    await use(new MenuPage(page));
  },
});

export { expect };
