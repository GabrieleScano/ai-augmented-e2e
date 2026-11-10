# AI-Augmented E2E Test Framework

A **multi-SUT** end-to-end framework built with **Playwright + TypeScript**: functional, **visual-regression** and **accessibility** tests for two very different systems, a public demo shop and a production PWA used by real families. It follows the **Page Object Model**, runs in **CI** inside the official Playwright Docker image, and includes an **optional AI module** that derives test cases from acceptance criteria.

[![E2E Tests](https://github.com/GabrieleScano/ai-augmented-e2e/actions/workflows/e2e.yml/badge.svg)](https://github.com/GabrieleScano/ai-augmented-e2e/actions/workflows/e2e.yml)
[![Playwright 1.61](https://img.shields.io/badge/Playwright-1.61.0-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev)
[![WCAG 2 A/AA](https://img.shields.io/badge/a11y-WCAG%202%20A%2FAA%20(axe)-6b46c1)](#accessibility)
[![Test report](https://img.shields.io/badge/report-live-2EAD33)](https://gabrielescano.github.io/ai-augmented-e2e/)

## Systems under test

| SUT | What it is | Environment | Projects | Coverage | Safety constraints |
|-----|------------|-------------|----------|----------|--------------------|
| **saucedemo** | [SauceDemo](https://www.saucedemo.com), a public demo e-commerce site | Desktop | `saucedemo-chromium`, `-firefox`, `-webkit` | 16 functional · 2 visual · 2 a11y | none (built for automation practice) |
| **menu-escolar** | [Menú Escolar · Poble-Sec](https://menu-escolar-poble-sec-i62w.vercel.app/), my school-canteen menu PWA (Catalan/Spanish/English) | Mobile (Pixel 7, iPhone 13) | `menu-escolar-chromium`, `-webkit` | 14 functional · 6 visual · 6 a11y | **production, real users**: read-only, 1 worker, no load tests, trackers blocked |

Plus a browser-less `unit` project: AI response parser (6) and framework guards (3).

Visual and accessibility specs run on Chromium only (one baseline set per SUT); functional specs run on every project.

## Why this project

- **One framework, several SUTs.** Each SUT has its own Playwright project(s), page objects, fixtures and specs, kept apart by folder. Adding a third SUT means adding a folder and a project, without touching the others.
- **Functional coverage.** SauceDemo: authentication, cart and a full checkout. menu-escolar: day navigation, calendar, deep links, dietary variants, allergens, language, sharing, onboarding and cookie consent.
- **Deterministic visual regression.** The clock is frozen, network data is mocked and only genuinely random UI is masked. Baselines are generated in the same Docker image CI uses.
- **Accessibility as a gate.** axe (WCAG 2 A/AA) runs on every screen. Known violations live in an explicit allowlist with a reason and a fix, and entries that stop reproducing fail the build.
- **Safe on production.** A fixture aborts any write and fails the test that attempted it.
- **Traceability.** Every test has a stable ID (`MENU-E2E-001`, `SAUCE-VIS-002`, …) at the start of its title, enforced by a unit test.
- **Automated failure triage.** Every run feeds [test-triage-kit](https://github.com/GabrieleScano/test-triage-kit), which classifies failures (bug / flaky / infrastructure) and deduplicates them by root cause.

## Project structure

```
tests/
  saucedemo/
    e2e/                       # login, inventory, checkout (SAUCE-E2E-*)
    pages/                     # Page Objects: login, inventory, checkout
    fixtures/                  # custom fixtures + centralized test data
    saucedemo.visual.spec.ts   # SAUCE-VIS-*
    saucedemo.a11y.spec.ts     # SAUCE-A11Y-*
    __screenshots__/           # visual baselines (generated in Docker)
  menu-escolar/
    e2e/                       # day navigation, menu types, app shell (MENU-E2E-*)
    pages/                     # MenuPage
    fixtures/                  # safety guard, pinned clock, mocked menu data
    menu-escolar.visual.spec.ts  # MENU-VIS-*
    menu-escolar.a11y.spec.ts    # MENU-A11Y-*
    __screenshots__/
  shared/                      # axe helper + allowlist, visual-env guard
  unit/                        # AI parser + framework guards (AI-UNIT-*, FW-UNIT-*)
src/ai/                        # optional AI test-generation module
.github/workflows/             # e2e.yml (CI), update-baselines.yml (manual)
```

## Getting started

```bash
npm ci
npx playwright install
npm test                      # everything for which a browser is installed
```

| Script | Runs |
|---|---|
| `npm run test:unit` | AI parser and framework guards (no browser) |
| `npm run test:saucedemo` | SauceDemo on Chromium, Firefox and WebKit |
| `npm run test:menu-escolar` | menu-escolar on mobile Chromium and WebKit, 1 worker |
| `npm run test:a11y` | accessibility specs for both SUTs |
| `npm run test:visual:docker` | visual specs inside the CI Docker image (needs Docker) |
| `npm run test:ui` / `npm run report` | UI mode / open the HTML report |

Visual specs **skip themselves outside Linux** (see below). Playwright 1.61 has no WebKit build for macOS 13, so on older Macs the WebKit projects run in CI only.

## Testing a production app safely (menu-escolar)

menu-escolar is used every day by families at the school, so the suite treats it as production. The rules are enforced in `tests/menu-escolar/fixtures/fixtures.ts`, not left to each test:

- **Read-only.** Any request other than GET/HEAD/OPTIONS is aborted *and fails the test*. The app's only write endpoint (`/api/*`, push-notification tags) is never reachable. Notification settings are deliberately not tested.
- **No side effects on real data.** Google Analytics and OneSignal are blocked, so runs don't skew usage statistics or create push subscriptions. The service worker is blocked.
- **Gentle load.** `workers: 1` on both menu-escolar projects, a single CI job for that SUT, at most one retry, a weekly schedule, and **no load or performance tests**.
- **Device-local state only.** The preferences tests change (menu type, language, onboarding, cookie choice) live in the test browser's localStorage.

## Visual regression

Screenshots are compared with `toHaveScreenshot`. A menu that changes every day would make naive screenshots useless, so determinism is built in:

| Source of change | How it is neutralised |
|---|---|
| Today's date (the app opens on "today") | `page.clock.setFixedTime` pins it to Wed 4 Nov 2026, 10:00 Europe/Madrid. Tests override it when needed, e.g. a Saturday. |
| The menu itself (loaded from `menus/AAAA-MM.js`) | `page.route` serves fixed data from `fixtures/menu-data.ts`, in the app's own format. The app code stays live: that's what is under test. |
| Animations, caret, web fonts | `animations: 'disabled'`, `caret: 'hide'`, and `document.fonts.ready` awaited before each shot |
| Genuinely random UI: on a weekend the greeting toast picks one of several messages | `mask`, applied only where the element is on screen (MENU-VIS-006). Masking an element that isn't shown would just hide a strip of real UI. |

### Why baselines are generated in Docker

Font rasterisation and anti-aliasing differ between macOS, Windows and Linux, and even between Linux distributions. A baseline captured on a laptop would make CI fail on noise. So baselines are produced in **exactly the environment CI compares against**: the official image `mcr.microsoft.com/playwright:v1.61.0-noble`, the same tag the CI jobs run in.

- The image tag must match `@playwright/test` in `package.json` (pinned to `1.61.0`). **FW-UNIT-002** fails if they diverge.
- Baseline paths have no platform suffix (`tests/<sut>/__screenshots__/…`). The visual specs skip themselves outside Linux instead of comparing against the wrong platform.

**Regenerating baselines** after an intended UI change:

- **GitHub Actions → "Update visual baselines" → Run workflow**, choosing the branch and the SUT. The workflow renders the screenshots in the Docker image and commits them back to that branch. If you run it on `main`, it pushes a new `visual-baselines/<run id>` branch to review instead.
- Or include `[update-baselines]` in a commit message pushed to a branch.

To compare locally against the committed baselines, run `npm run test:visual:docker`. It needs Docker and runs the same image.

## Accessibility

`tests/shared/a11y.ts` runs [axe](https://github.com/dequelabs/axe-core) through `@axe-core/playwright` with the **WCAG 2.0/2.1 A and AA** rule sets, on every screen of both SUTs (login and inventory; home, sheets, calendar and onboarding).

Known violations are **not hidden**. They are listed in [`tests/shared/a11y-allowlist.ts`](tests/shared/a11y-allowlist.ts), each with the rule, the scope, *why* it is tolerated and *what fixes it*. The checker enforces two rules:

1. Any violation that is **not** in the allowlist fails the test.
2. Any allowlist entry that **no longer reproduces** fails the test too, so the list shrinks as fixes ship.

Tolerated violations are attached to the HTML report as annotations.

Real outcome: the first run found three WCAG issues in menu-escolar: the menu-type listbox ARIA structure (three axe rules) and two colour-contrast failures. They were fixed in the app the same day, rule 2 flagged the stale entries, and they were removed. Exploratory testing then found a keyboard-focus escape from modal sheets, which was fixed with a regression test in the app. One finding is **accepted by design** and documented as such: axe flags the week-bar day pills under WCAG 2.5.3 (Label in Name) because their name omits the visible abbreviation "DC". The words a voice-control user would actually say are in the name, and adding the abbreviation would make screen readers read out noise. The allowlist records this trade-off, which is the point of having one: a human decision, written down, not a muted rule.

## Traceability

Every test title starts with a stable ID in the format `<SUT>-<TYPE>-NNN`:

| Prefix | Meaning |
|---|---|
| `SAUCE-E2E` / `SAUCE-VIS` / `SAUCE-A11Y` | SauceDemo functional / visual / accessibility |
| `MENU-E2E` / `MENU-VIS` / `MENU-A11Y` | menu-escolar functional / visual / accessibility |
| `AI-UNIT` / `FW-UNIT` | AI module / framework guards |

IDs are stable: they never get reused or renumbered. **FW-UNIT-001** fails on a missing, malformed or duplicate ID. To build a traceability matrix, run `npx playwright test --list`, filter by ID with `--grep MENU-E2E-007`, or read the JSON/Allure reports.

## AI test generation (optional)

The AI module is **optional**. Without an API key, nothing breaks:

- CI never calls it and has no `ANTHROPIC_API_KEY` secret, so **CI stays green without a key**.
- `npm run ai:generate` without a key prints how to enable it and exits cleanly.
- Its response parser is covered by offline unit tests (`AI-UNIT-*`), which need no key.

To use it:

```bash
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run ai:generate
```

Given a user story with acceptance criteria, the module produces two things:

- **Observations**: ambiguities and gaps in the requirements.
- **Test cases**: positive, negative, edge and boundary scenarios, written to `generated-tests.json`.

The model output is never trusted blindly. `parseGenerationResult` strips markdown fences and validates the JSON shape before anything uses it.

## CI

`.github/workflows/e2e.yml` runs on every push and PR to `main`, weekly on Monday at 06:00 UTC (both SUTs are live sites that can change without notice), and on demand:

| Job | Where | What |
|---|---|---|
| Type-check + unit tests | `ubuntu-latest` | `tsc --noEmit`, `unit` project |
| SauceDemo (chromium / firefox / webkit) | Playwright image | functional; Chromium also runs visual and a11y |
| menu-escolar | Playwright image | both mobile projects, **one worker** |
| Merge reports & publish | `ubuntu-latest`, `main` only | merged HTML report on [GitHub Pages](https://gabrielescano.github.io/ai-augmented-e2e/) |

Each browser job also runs test-triage-kit and uploads its triage report. `update-baselines.yml` is the manual baseline workflow described above.

## Tech stack

| Area | Tools |
|------|-------|
| Runner | Playwright Test 1.61 |
| Language | TypeScript (strict) |
| Accessibility | axe-core via `@axe-core/playwright` |
| Reporting | Playwright HTML, Allure |
| Failure triage | [test-triage-kit](https://github.com/GabrieleScano/test-triage-kit) |
| CI | GitHub Actions + official Playwright Docker image |
| AI (optional) | Anthropic Messages API |

## Design principles

- One test = one behaviour, named with intent and prefixed with a stable ID.
- Tests are isolated and independent: no shared state, no implicit ordering.
- Locators are semantic (`getByRole`, accessible names), and data attributes are used only where the accessible name is a full localised date.
- Assertions are web-first and auto-waiting: no `waitForTimeout`.
- Production systems are read-only by construction, not by convention.

## License

MIT
