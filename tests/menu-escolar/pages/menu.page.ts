import { type Locator, type Page, expect } from '@playwright/test';

/**
 * Page Object for menu-escolar (single-page PWA).
 *
 * Locators prefer roles and accessible names (the app is well labelled);
 * `data-day` / `data-al` attributes are used where the accessible name is a
 * full localised date that would make specs brittle.
 * Default language in the tests is Catalan (locale ca-ES).
 */
export class MenuPage {
  readonly weekLabel: Locator;
  readonly weekPrev: Locator;
  readonly weekNext: Locator;
  readonly selectedPill: Locator;
  readonly menuTypeLabel: Locator;
  readonly backToToday: Locator;
  readonly tabbar: Locator;
  readonly filterSheet: Locator;
  readonly allergenSheet: Locator;
  readonly calendarSheet: Locator;
  readonly moreSheet: Locator;
  readonly onboarding: Locator;
  readonly cookieBanner: Locator;
  readonly weekendToast: Locator;

  constructor(private readonly page: Page) {
    this.weekLabel = page.locator('#weekLabel');
    this.weekPrev = page.locator('#weekPrev');
    this.weekNext = page.locator('#weekNext');
    this.selectedPill = page.locator('#weekDays .day-pill[aria-pressed="true"]');
    this.menuTypeLabel = page.locator('#schoolMenuLabel');
    this.backToToday = page.locator('#backToToday');
    this.tabbar = page.locator('#tabbar');
    this.filterSheet = page.locator('#filterSheet');
    this.allergenSheet = page.locator('#allergenSheet');
    this.calendarSheet = page.locator('#calSheet');
    this.moreSheet = page.locator('#moreSheet');
    this.onboarding = page.locator('#obOverlay');
    this.cookieBanner = page.locator('#cookieBanner');
    this.weekendToast = page.locator('#weekendToast');
  }

  async goto(query = ''): Promise<void> {
    await this.page.goto(`/${query}`);
    await expect(this.page.locator('#weekDays .day-pill').first()).toBeVisible();
  }

  /** Wait for web fonts (text + icon font) so screenshots are stable. */
  async settle(): Promise<void> {
    await this.page.evaluate(() => document.fonts.ready.then(() => undefined));
  }

  dayPill(day: number): Locator {
    return this.page.locator(`#weekDays .day-pill[data-day="${day}"]`);
  }

  /** The card for a given day in the horizontal track. */
  slide(day: number, monthKey = '2026-11'): Locator {
    return this.page.locator(`#menuContainer .day-slide[data-key="${monthKey}"][data-day="${day}"]`);
  }

  lunchCourses(day: number, monthKey = '2026-11'): Locator {
    return this.slide(day, monthKey).locator('.meal-section.lunch .course');
  }

  tab(name: RegExp | string): Locator {
    return this.tabbar.getByRole('button', { name });
  }

  async openMenuTypes(): Promise<void> {
    // Accessible name is "Tipus de menú: <current>. Canviar".
    await this.tab(/Tipus de menú/).click();
    await expect(this.filterSheet).toBeVisible();
  }

  async chooseMenuType(name: RegExp | string): Promise<void> {
    await this.openMenuTypes();
    await this.filterSheet.getByRole('option', { name }).click();
    await expect(this.filterSheet).toBeHidden();
  }

  async openAllergens(): Promise<void> {
    await this.tab('Al·lèrgens').click();
    await expect(this.allergenSheet).toBeVisible();
  }

  allergen(letter: string): Locator {
    return this.allergenSheet.locator(`.al-item[data-al="${letter}"]`);
  }

  async openCalendar(): Promise<void> {
    await this.page.locator('#weekLabelBtn').click();
    await expect(this.calendarSheet).toBeVisible();
  }

  calendarDay(day: number): Locator {
    return this.calendarSheet.locator(`.cal-day[data-day="${day}"]`);
  }

  async openMore(): Promise<void> {
    await this.tab(/Més|Más|More/).click();
    await expect(this.moreSheet).toBeVisible();
  }

  async setLanguage(code: 'ca' | 'es' | 'en'): Promise<void> {
    await this.openMore();
    const details = this.moreSheet.locator('details', { has: this.page.locator('#currentLangName') });
    if (!(await details.getAttribute('open').then((v) => v !== null))) {
      await details.locator('summary').click();
    }
    await this.moreSheet.locator(`.lang-option[data-lang="${code}"]`).click();
  }

  async closeSheets(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }
}
