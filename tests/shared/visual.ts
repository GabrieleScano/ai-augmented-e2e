import { test } from '@playwright/test';

/**
 * Screenshot baselines are only valid in the environment that produced them:
 * the official Playwright Docker image used by CI (Linux). Font rendering on
 * macOS/Windows differs enough to fail every comparison, so visual specs skip
 * themselves elsewhere instead of producing noise.
 *
 * Run them locally inside the same image: `npm run test:visual:docker`.
 * Regenerate baselines: GitHub Actions → "Update visual baselines" (manual).
 */
export function onlyInBaselineEnvironment(): void {
  test.skip(
    process.platform !== 'linux',
    'Visual baselines are generated in the Playwright Docker image (Linux). Run `npm run test:visual:docker`.',
  );
}
