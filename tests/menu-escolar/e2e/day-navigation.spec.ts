import { test, expect } from '../fixtures/fixtures.js';
import { allergensOn, lunchOn } from '../fixtures/menu-data.js';

/**
 * Day navigation: which day the app opens on, and every way to move between
 * days (week arrows, calendar, back-to-today, deep link).
 * Clock pinned to Wednesday 4 November 2026 unless a test overrides `today`.
 */

test.describe('Day navigation', () => {
  test("MENU-E2E-001 opens on today's menu with lunch, dinner and allergens", async ({ menu }) => {
    await menu.goto();

    await expect(menu.selectedPill).toHaveAttribute('data-day', '4');
    await expect(menu.dayPill(4)).toHaveAccessibleName(/4 de novembre, avui/i);
    await expect(menu.weekLabel).toHaveText('2 – 6 Novembre');

    const today = menu.slide(4);
    await expect(menu.lunchCourses(4)).toHaveText(lunchOn(4));
    await expect(today.locator('.meal-section.dinner .course')).toHaveText(['Verdura cuinada', 'Peix blau']);
    await expect(today.locator('.meal-section.lunch .al-chip')).toHaveText(allergensOn(4));
  });

  test('MENU-E2E-002 shows a public holiday as "Festiu" without a menu', async ({ menu }) => {
    await menu.goto();

    await expect(menu.dayPill(2)).toHaveAccessibleName(/festiu/i);
    await menu.dayPill(2).click();

    await expect(menu.slide(2)).toContainText('Dia festiu');
    await expect(menu.slide(2).locator('.meal-section')).toHaveCount(0);
  });

  test.describe('on a weekend', () => {
    test.use({ today: '2026-11-07T10:00:00+01:00' }); // Saturday

    test('MENU-E2E-003 jumps to the next school day and greets the weekend', async ({ menu }) => {
      await menu.goto();

      await expect(menu.selectedPill).toHaveAttribute('data-day', '9');
      await expect(menu.weekLabel).toHaveText('9 – 13 Novembre');
      await expect(menu.weekendToast).toBeVisible();
    });
  });

  test('MENU-E2E-004 week arrows move to the previous and next week', async ({ menu }) => {
    await menu.goto();

    await menu.weekNext.click();
    await expect(menu.weekLabel).toHaveText('9 – 13 Novembre');

    await menu.weekPrev.click();
    await menu.weekPrev.click();
    // Crosses into October, which the fixture also provides.
    await expect(menu.weekLabel).toHaveText('26 – 30 Octubre');
  });

  test('MENU-E2E-005 the calendar jumps to a chosen day', async ({ menu }) => {
    await menu.goto();

    await menu.openCalendar();
    await expect(menu.calendarSheet.locator('#calTitle')).toHaveText('Novembre 2026');
    await expect(menu.calendarDay(7)).toBeDisabled(); // Saturday

    await menu.calendarDay(19).click();
    await expect(menu.calendarSheet).toBeHidden();
    await expect(menu.selectedPill).toHaveAttribute('data-day', '19');
    await expect(menu.weekLabel).toHaveText('16 – 20 Novembre');
  });

  test('MENU-E2E-006 "Torna a avui" appears away from today and brings you back', async ({ menu }) => {
    await menu.goto();
    await expect(menu.backToToday).not.toHaveClass(/\bshow\b/);

    await menu.weekNext.click();
    await expect(menu.backToToday).toHaveClass(/\bshow\b/);

    await menu.backToToday.click();
    await expect(menu.selectedPill).toHaveAttribute('data-day', '4');
    await expect(menu.backToToday).not.toHaveClass(/\bshow\b/);
  });

  test('MENU-E2E-011 a ?dia= link opens that day and then cleans the URL', async ({ menu, page }) => {
    await menu.goto('?dia=2026-11-05');

    await expect(menu.selectedPill).toHaveAttribute('data-day', '5');
    await expect(menu.lunchCourses(5)).toHaveText(lunchOn(5));
    await expect(page).not.toHaveURL(/dia=/);
  });
});
