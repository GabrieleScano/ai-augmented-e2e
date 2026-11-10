import { test, expect } from '../fixtures/fixtures.js';
import { allergensOn, lunchOn } from '../fixtures/menu-data.js';

/**
 * Menu types (dietary variants) and the allergen legend.
 * The chosen variant is a device-local preference (localStorage): nothing is
 * sent to the server.
 */

test.describe('Menu types and allergens', () => {
  test('MENU-E2E-007 choosing a menu type swaps the dishes and survives a reload', async ({ menu, page }) => {
    await menu.goto();
    await expect(menu.menuTypeLabel).toHaveText('Basal');

    await menu.chooseMenuType(/Vegà/);

    await expect(menu.menuTypeLabel).toHaveText('Vegà');
    const [first, , fruit] = lunchOn(4);
    await expect(menu.lunchCourses(4)).toHaveText([first!, 'Hamburguesa vegetal ECO amb enciam', fruit!]);

    await page.reload();
    await expect(menu.menuTypeLabel).toHaveText('Vegà');
  });

  test('MENU-E2E-008 a variant not published for the day says so instead of showing the basal menu', async ({ menu }) => {
    await menu.goto();

    await menu.chooseMenuType(/Halal/);

    // The fixture leaves halal unpublished on the 4th only.
    await expect(menu.slide(4)).toContainText('Menú no disponible');
    await expect(menu.slide(4).locator('.meal-section')).toHaveCount(0);
    await menu.dayPill(5).click();
    await expect(menu.lunchCourses(5)).toHaveText(lunchOn(5));
  });

  test('MENU-E2E-009 the allergen legend highlights the allergens of the selected day', async ({ menu }) => {
    await menu.goto();
    await menu.openAllergens();

    const present = allergensOn(4);
    for (const letter of present) {
      await expect(menu.allergen(letter), `allergen ${letter} is in today's lunch`).toHaveClass(/is-present/);
    }
    await expect(menu.allergenSheet.locator('.al-item.is-present')).toHaveCount(present.length);
  });
});
