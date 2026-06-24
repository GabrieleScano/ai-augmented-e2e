# AI-Augmented E2E Test Framework

End-to-end test automation framework built with **Playwright + TypeScript**, following the **Page Object Model**, running cross-browser in **CI**, and extended with an **AI module** that derives test cases from acceptance criteria.

[![E2E Tests](https://github.com/GabrieleScano/ai-augmented-e2e/actions/workflows/e2e.yml/badge.svg)](https://github.com/GabrieleScano/ai-augmented-e2e/actions/workflows/e2e.yml)

> Tests target [SauceDemo](https://www.saucedemo.com), a stable public demo application.

## Why this project

It demonstrates a complete QA automation workflow:

- **Functional coverage** — authentication, cart and a full checkout flow.
- **Maintainable design** — Page Object Model, custom fixtures, centralized test data, semantic locators, and web-first assertions (no fixed waits).
- **Cross-browser CI** — Chromium, Firefox and WebKit on every push via GitHub Actions, with HTML reports as artifacts.
- **AI-augmented test design** — a module that takes a user story + acceptance criteria and returns structured test cases plus shift-left observations (ambiguities, missing edge cases).

## Tech stack

| Area | Tools |
|------|-------|
| Runner | Playwright Test |
| Language | TypeScript (strict) |
| Reporting | Playwright HTML, Allure |
| CI | GitHub Actions |
| AI | Anthropic Messages API |

## Project structure

```
tests/
  e2e/            # specs grouped by feature
  pages/          # Page Objects (login, inventory, checkout)
  fixtures/       # custom fixtures + centralized test data
src/
  ai/             # AI test-generation module
.github/workflows # CI pipeline
```

## Getting started

```bash
npm ci
npx playwright install
npm test
```

Useful scripts:

```bash
npm run test:ui      # interactive UI mode
npm run test:headed  # headed browser
npm run report       # open the HTML report
```

## AI test generation

```bash
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run ai:generate
```

Given an acceptance-criteria set, the module outputs:

- **Observations** — ambiguities and gaps detected in the requirements.
- **Test cases** — positive, negative, edge and boundary scenarios with steps and expected results, written to `generated-tests.json`.

This mirrors a shift-left practice: surfacing requirement issues *before* implementation, and accelerating test design without replacing engineering judgement.

## Design principles

- One test = one behaviour, named with intent.
- Tests are isolated and independent — no shared state, no implicit ordering.
- Locators are semantic (`getByRole`, `getByPlaceholder`, `getByTestId`).
- Assertions are web-first and auto-waiting — no `waitForTimeout`.

## License

MIT
