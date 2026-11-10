/**
 * Deterministic menu data for menu-escolar.
 *
 * The real app loads one script per month (menus/AAAA-MM.js) that calls the
 * global registerMonth(). Tests intercept those requests and serve the months
 * below instead, so assertions and screenshots never depend on what the school
 * cooks this week. The *app code* (app.js, i18n.js, styles) is still the live,
 * deployed one: that is the system under test.
 *
 * Format mirrors the app's menu-data.js: { menus: { basal }, patches, noDisponible }.
 */

const DAY_NAMES = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'] as const;

interface Dish {
  t: string;
  eco: boolean;
  al: string;
}

interface DayEntry {
  day: number;
  name: string;
  isWeekend: boolean;
  festiu?: boolean;
  tag?: string | null;
  lunch?: Dish[];
  dinner?: Array<{ t: string }>;
}

const plat = (t: string, al = ''): Dish => ({ t, eco: t.includes('ECO'), al });

const FIRST_COURSES: Dish[] = [
  plat('Macarrons integrals amb tomàquet i formatge ratllat ECO', '(B, O, L)'),
  plat('Crema de carbassa ECO'),
  plat('Llenties estofades amb arròs ECO', '(B)'),
  plat('Sopa de galets amb brou de verdures ECO', '(B, A)'),
  plat('Arròs amb verdures de temporada ECO'),
];

const SECOND_COURSES: Dish[] = [
  plat('Abadejo enfarinat ECO amb amanida', '(P, B)'),
  plat('Pollastre rostit amb patates'),
  plat("Truita de patata i ceba ECO amb enciam", '(O)'),
  plat('Mandonguilles de vedella amb pèsols', '(B, O)'),
  plat('Llom al forn amb verdures', '(S)'),
];

const FRUIT = plat('Fruita de temporada ECO');
const DINNER = [{ t: 'Verdura cuinada' }, { t: 'Peix blau' }];

/** Public holidays in the fixture (served as "Festiu"). */
export const HOLIDAYS: Record<string, number[]> = {
  '2026-10': [12],
  '2026-11': [2],
};

function daysIn(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function buildMonth(year: number, month: number) {
  const key = `${year}-${String(month).padStart(2, '0')}`;
  const basal: DayEntry[] = [];
  const vegaPatch: Record<number, Record<number, { t: string; al: string }>> = {};

  for (let day = 1; day <= daysIn(year, month); day++) {
    const dow = new Date(year, month - 1, day).getDay();
    const name = DAY_NAMES[dow]!;
    if (dow === 0 || dow === 6) {
      basal.push({ day, name, isWeekend: true });
      continue;
    }
    if (HOLIDAYS[key]?.includes(day)) {
      basal.push({ day, name, isWeekend: false, festiu: true, tag: 'Festiu' });
      continue;
    }
    basal.push({
      day,
      name,
      isWeekend: false,
      tag: null,
      lunch: [FIRST_COURSES[day % 5]!, SECOND_COURSES[day % 5]!, FRUIT],
      dinner: DINNER,
    });
    // Vegan variant: replace the second course every weekday.
    vegaPatch[day] = { 1: { t: 'Hamburguesa vegetal ECO amb enciam', al: '(S)' } };
  }

  return {
    menus: { basal },
    patches: { vega: vegaPatch },
    // Halal is published every day except the 4th (exercises "menú no disponible").
    // Variants not mentioned at all (e.g. no-gluten) are unavailable all month.
    noDisponible: { halal: [4] },
  };
}

export const FIXTURE_MONTHS = ['2026-10', '2026-11'] as const;

/** Source of a menus/AAAA-MM.js file, or a harmless no-op for months not in the fixture. */
export function monthScript(key: string): string {
  if (!(FIXTURE_MONTHS as readonly string[]).includes(key)) {
    return `/* ${key}: not part of the test fixture */\n`;
  }
  const [year, month] = key.split('-').map(Number) as [number, number];
  return `registerMonth(${year}, ${month}, ${JSON.stringify(buildMonth(year, month))});\n`;
}

/** Lunch dishes the fixture serves on a given November 2026 weekday (basal). */
export function lunchOn(day: number): string[] {
  return [FIRST_COURSES[day % 5]!.t, SECOND_COURSES[day % 5]!.t, FRUIT.t];
}

/** Allergen letters present in the basal lunch of a given day. */
export function allergensOn(day: number): string[] {
  const letters = [FIRST_COURSES[day % 5]!, SECOND_COURSES[day % 5]!, FRUIT]
    .flatMap((d) => d.al.replace(/[()]/g, '').split(','))
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(letters)].sort();
}
