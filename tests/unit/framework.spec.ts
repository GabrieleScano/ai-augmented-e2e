import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { KNOWN_VIOLATIONS } from '../shared/a11y-allowlist.js';

/**
 * Guards on the framework itself (no browser, no network).
 * They keep the traceability IDs, the visual-baseline environment and the
 * accessibility allowlist honest as the suite grows.
 */

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const ID_FORMAT = /^(SAUCE|MENU|AI|FW)-(E2E|VIS|A11Y|UNIT)-\d{3}$/;

function specFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'node_modules' ? [] : specFiles(path);
    return name.endsWith('.spec.ts') ? [path] : [];
  });
}

/** IDs declared in test titles, or in `id:` fields of data-driven cases. */
function declaredIds(source: string): string[] {
  const inTitles = [...source.matchAll(/\btest\(\s*['"`]([A-Z0-9]+-[A-Z0-9]+-\d{3})\s/g)].map((m) => m[1]!);
  const inData = [...source.matchAll(/\bid:\s*'([A-Z0-9]+-[A-Z0-9]+-\d{3})'/g)].map((m) => m[1]!);
  return [...inTitles, ...inData];
}

test('FW-UNIT-001 every test carries a unique, well-formed traceability ID', () => {
  const ids: string[] = [];
  const missing: string[] = [];

  for (const file of specFiles(join(ROOT, 'tests'))) {
    const source = readFileSync(file, 'utf8');
    ids.push(...declaredIds(source));
    // Every test(...) call must start its title with an ID (or interpolate one).
    for (const m of source.matchAll(/\btest\(\s*(['"`])(.*?)\1/g)) {
      const title = m[2]!;
      if (!/^([A-Z0-9]+-[A-Z0-9]+-\d{3}|\$\{tc\.id\}) /.test(title)) missing.push(`${file.replace(ROOT, '')}: "${title}"`);
    }
  }

  expect(missing, 'tests without an ID at the start of the title').toEqual([]);
  expect(ids.filter((id) => !ID_FORMAT.test(id)), 'IDs not matching <SUT>-<TYPE>-NNN').toEqual([]);
  expect(ids.filter((id, i) => ids.indexOf(id) !== i), 'duplicate IDs').toEqual([]);
});

test('FW-UNIT-002 the CI Docker image matches the installed Playwright version', () => {
  const installed = JSON.parse(readFileSync(join(ROOT, 'node_modules/@playwright/test/package.json'), 'utf8')).version;
  const workflows = readdirSync(join(ROOT, '.github/workflows')).map((f) =>
    readFileSync(join(ROOT, '.github/workflows', f), 'utf8'),
  );
  const tags = workflows.flatMap((w) => [...w.matchAll(/mcr\.microsoft\.com\/playwright:v([\d.]+)-/g)].map((m) => m[1]));

  expect(tags.length, 'workflows should run visual tests in the official image').toBeGreaterThan(0);
  expect(new Set(tags), 'baselines are only comparable when image and library versions match').toEqual(
    new Set([installed]),
  );
});

test('FW-UNIT-003 every allowlisted a11y violation is explained and scoped', () => {
  for (const entry of KNOWN_VIOLATIONS) {
    expect(entry.scope, JSON.stringify(entry)).toMatch(/^(saucedemo|menu-escolar)\/[a-z-]+$/);
    expect(entry.reason.length, `${entry.scope} ${entry.rule}: reason`).toBeGreaterThan(20);
    expect(entry.fix.length, `${entry.scope} ${entry.rule}: fix`).toBeGreaterThan(20);
  }
});
