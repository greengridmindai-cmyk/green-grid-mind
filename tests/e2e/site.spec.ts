/**
 * Site acceptance checks (§12): i18n completeness per language, language switch behaviour,
 * same-origin network only, legacy hash aliases, no video for reduced motion / Save-Data.
 */
import { test, expect, type Page } from '@playwright/test';
import { de } from '../../src/i18n/de.ts';
import { en } from '../../src/i18n/en.ts';
import { ru } from '../../src/i18n/ru.ts';
import { legalDe, legalEn, legalRu } from '../../src/i18n/legal.ts';
import { CABINET } from '../../src/components/node3d/cabinetData.js';
import { SITE } from '../../src/components/node3d/siteData.js';
import { SEASONS } from '../../src/components/node3d/energyModel.js';
import { extractText } from '../../src/components/node3d/i18n/text.ts';
import { de as node3dDe } from '../../src/components/node3d/i18n/de.ts';
import { en as node3dEn } from '../../src/components/node3d/i18n/en.ts';

type Lang = 'de' | 'en' | 'ru';
const LANGS: Lang[] = ['de', 'en', 'ru'];
/** node3d module texts: Russian masters (cabinetData.js / siteData.js) and their translations */
const node3dRu = extractText(CABINET, SITE, SEASONS);
const SOURCES: Record<Lang, unknown[]> = {
  de: [de, node3dDe, legalDe],
  en: [en, node3dEn, legalEn],
  ru: [ru, node3dRu, legalRu],
};

function strings(o: unknown): string[] {
  if (typeof o === 'string') return [o];
  if (Array.isArray(o)) return o.flatMap(strings);
  if (o && typeof o === 'object') return Object.values(o).flatMap(strings);
  return [];
}

/**
 * Text fragments between placeholders that carry real words (numbers and terms excluded).
 * Single words are skipped: cognates (Server, Chiller, Reserve, Flexible) are legitimately shared.
 */
function fragments(lang: Lang): Set<string> {
  const out = new Set<string>();
  for (const s of SOURCES[lang].flatMap(strings))
    for (const f of s.split(/\{[A-Za-z0-9_]+\}/)) {
      const t = f.trim().replace(/^[\s,.;:()·—–/-]+|[\s,.;:()·—–/-]+$/g, '');
      const words = t.split(/\s+/).filter((w) => /\p{L}{3,}/u.test(w) && !/^\d/.test(w));
      if (t.length >= 8 && words.length >= 2 && !t.includes('TODO')) out.add(t);
    }
  return out;
}
const FRAG: Record<Lang, Set<string>> = { de: fragments('de'), en: fragments('en'), ru: fragments('ru') };
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Foreign fragments = present in another language and absent from this one. */
function foreignIn(text: string, lang: Lang): string[] {
  const own = FRAG[lang];
  const hits: string[] = [];
  for (const other of LANGS.filter((l) => l !== lang))
    for (const f of FRAG[other]) {
      if (own.has(f)) continue;
      if (new RegExp(`(?<![\\p{L}\\p{N}])${esc(f)}(?![\\p{L}\\p{N}])`, 'u').test(text))
        hits.push(`[${other}] ${f}`);
    }
  return hits;
}

async function visibleText(page: Page) {
  return page.evaluate(() => document.body.innerText);
}

test.describe('i18n completeness', () => {
  for (const lang of LANGS) {
    test(`main page in ${lang}: menu, 3D panel, site check result, form error`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width: 1024, height: 800 });
      await page.goto(`?lang=${lang}&e2e`);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      const texts: string[] = [];
      // menu
      await page.locator('.burger').click();
      await page.waitForTimeout(900);
      texts.push(await page.locator('#mobile-menu').innerText());
      await page.keyboard.press('Escape');
      // 3D scene: building panel (scene overlays included), then the cabinet with one component
      await page.locator('#modell').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => '__ggm' in window, null, { timeout: 90_000 });
      await page.waitForSelector('.n3d-panel-in');
      await page.evaluate(() =>
        (window as unknown as { __ggm: { setLevel(l: string): Promise<void> } }).__ggm.setLevel('building'),
      );
      await page.waitForTimeout(600);
      texts.push(await page.locator('.n3d').innerText());
      await page.evaluate(() =>
        (window as unknown as { __ggm: { setLevel(l: string): Promise<void> } }).__ggm.setLevel('cabinet'),
      );
      await page.locator('.n3d-list button[data-id="lcp"]').click();
      await page.waitForSelector('.n3d-card[data-comp="lcp"]');
      for (const d of await page.locator('.n3d-details').all())
        await d.evaluate((el) => ((el as HTMLDetailsElement).open = true));
      // site check: answer a few questions → result with checklist
      const check = page.locator('#standort-check');
      await check.scrollIntoViewIfNeeded();
      for (const fs of (await check.locator('fieldset').all()).slice(0, 4))
        await fs.locator('.opt').first().click();
      // contact form: submit empty → validation errors
      await page.locator('.contact-form button[type=submit]').click();
      await expect(page.locator('.contact-form .err').first()).toBeVisible();
      texts.push(await visibleText(page));
      const hits = foreignIn(texts.join('\n'), lang);
      expect(hits, hits.join('\n')).toEqual([]);
    });

    for (const p of ['impressum', 'datenschutz']) {
      test(`${p} in ${lang}`, async ({ page }) => {
        await page.goto(`${p}/?lang=${lang}`);
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        await expect(page.locator('h1')).toBeVisible();
        const hits = foreignIn(await visibleText(page), lang);
        expect(hits, hits.join('\n')).toEqual([]);
      });
    }
  }
});

test('language switch keeps hash and scroll position and loads no new document', async ({ page }) => {
  await page.goto('#knoten');
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => window.scrollY);
  const docs: string[] = [];
  page.on('request', (r) => r.resourceType() === 'document' && docs.push(r.url()));
  await page.locator('.site-header .lang-switch button[lang="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => window.scrollY);
  expect(Math.abs(after - before)).toBeLessThanOrEqual(4);
  expect(page.url()).toContain('lang=en');
  expect(page.url()).toContain('#knoten');
  expect(docs).toEqual([]);
  await expect(page).toHaveTitle(/nodes for farms/);
  // persists across pages
  await page.goto('impressum/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.locator('.site-header .lang-switch button[lang="de"]').click();
  expect(page.url()).not.toContain('lang=');
});

test('only same-origin requests: load, scroll to bottom, open 3D', async ({ page }) => {
  test.setTimeout(120_000);
  const foreign: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol.startsWith('http') && u.host !== 'localhost:4174') foreign.push(r.url());
  });
  await page.goto('?e2e');
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 600) await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.locator('#modell').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => '__ggm' in window, null, { timeout: 90_000 });
  await page.goto('datenschutz/');
  expect(foreign).toEqual([]);
});

for (const [legacy, target] of Object.entries({
  cabinet: 'modell',
  node: 'knoten',
  configs: 'knoten',
  site: 'hoefe',
  tech: 'prinzip',
})) {
  test(`legacy link #${legacy} lands on #${target}`, async ({ page }) => {
    await page.goto(`#${legacy}`);
    await expect(page).toHaveURL(new RegExp(`#${target}$`));
    await page.waitForTimeout(1200);
    const top = await page.locator(`#${target}`).evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.abs(top)).toBeLessThan(120);
  });
}

test('reduced motion and Save-Data request no video', async ({ browser }) => {
  for (const opts of [{ reducedMotion: 'reduce' as const }, {}]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    if (!('reducedMotion' in opts))
      await page.addInitScript(() =>
        Object.defineProperty(navigator, 'connection', { value: { saveData: true } }),
      );
    const media: string[] = [];
    page.on('request', (r) => /hero\.(mp4|webm)/.test(r.url()) && media.push(r.url()));
    await page.goto('http://localhost:4174/green-grid-mind/');
    await page.waitForTimeout(1500);
    expect(media).toEqual([]);
    await ctx.close();
  }
});
