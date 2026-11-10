import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { KNOWN_VIOLATIONS, type KnownViolation } from './a11y-allowlist.js';

/** WCAG 2.0 and 2.1, levels A and AA. */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

interface Finding {
  rule: string;
  impact: string;
  help: string;
  targets: string[];
}

const matches = (entry: KnownViolation, f: Finding): boolean =>
  entry.rule === f.rule &&
  (!entry.targets || f.targets.some((t) => entry.targets!.some((needle) => t.includes(needle))));

/**
 * Run axe (WCAG 2 A/AA) on the current page state and compare it with the
 * documented allowlist for `scope` (`<sut>/<screen>`).
 *
 * Fails on (a) any violation not in the allowlist and (b) any allowlist entry
 * that no longer reproduces. Tolerated violations are attached to the report
 * as annotations, so they stay visible rather than hidden.
 */
export async function expectNoA11yViolations(page: Page, scope: string, include?: string): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (include) builder = builder.include(include);
  const results = await builder.analyze();

  const findings: Finding[] = results.violations.map((v) => ({
    rule: v.id,
    impact: v.impact ?? 'unknown',
    help: v.help,
    targets: v.nodes.map((n) => n.target.join(' ')),
  }));

  const allowed = KNOWN_VIOLATIONS.filter((e) => e.scope === scope);
  const unexpected = findings.filter((f) => !allowed.some((e) => matches(e, f)));
  const stale = allowed.filter((e) => !findings.some((f) => matches(e, f)));

  for (const e of allowed.filter((a) => !stale.includes(a))) {
    test.info().annotations.push({
      type: 'known a11y violation',
      description: `${scope} · ${e.rule}: ${e.reason} Fix: ${e.fix}`,
    });
  }

  expect(
    unexpected.map((f) => `${f.rule} (${f.impact}): ${f.help} → ${f.targets.slice(0, 5).join(', ')}`),
    `new accessibility violations on ${scope} (fix them, or document them in tests/shared/a11y-allowlist.ts)`,
  ).toEqual([]);

  expect(
    stale.map((e) => `${e.scope} · ${e.rule}`),
    `allowlist entries for ${scope} no longer reproduce: the fix shipped, remove them from tests/shared/a11y-allowlist.ts`,
  ).toEqual([]);
}
