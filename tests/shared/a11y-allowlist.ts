/**
 * Known accessibility violations, documented on purpose.
 *
 * Every entry says WHY it is tolerated and what fixes it. The checker in
 * ./a11y.ts enforces two rules:
 *   1. Any violation NOT listed here fails the test.
 *   2. Any entry listed here that NO LONGER occurs also fails the test, so the
 *      list shrinks as fixes ship instead of silently hiding regressions.
 *
 * Scope keys are `<sut>/<screen>`, matching the second argument of
 * expectNoA11yViolations().
 */

export interface KnownViolation {
  /** `<sut>/<screen>` this entry applies to. */
  scope: string;
  /** axe rule id, e.g. "color-contrast". */
  rule: string;
  /** Optional: only nodes whose CSS target contains one of these strings. Omit = all nodes. */
  targets?: string[];
  /** Why it is accepted for now. Required: an unexplained exception is not allowed. */
  reason: string;
  /** Where the fix is tracked. */
  fix: string;
}

export const KNOWN_VIOLATIONS: KnownViolation[] = [
  // ── menu-escolar ────────────────────────────────────────────────────────
  // History: on 2026-11-10 this list also held the "ECO" badge and menu-type
  // contrast issues and the listbox ARIA structure of the menu-type sheet.
  // They were fixed in the app the same day; the stale-entry check flagged
  // them and they were removed.
  {
    scope: 'menu-escolar/home',
    rule: 'label-content-name-mismatch',
    targets: ['.day-pill', 'button[aria-label='],
    reason:
      'Week-bar day pills show "DC 4 AVUI" but are named "Dimecres 4 de novembre, avui" (WCAG 2.5.3 Label in Name): ' +
      'voice-control users who say what they see ("DC 4") may not hit the button. Found by this suite on 2026-11-10.',
    fix:
      'menu-escolar repo, app.js renderWeekbar(): start aria-label with the visible text, ' +
      'e.g. "DC 4 · Dimecres 4 de novembre, avui", or drop aria-label and put the long date in a visually hidden span.',
  },
];
