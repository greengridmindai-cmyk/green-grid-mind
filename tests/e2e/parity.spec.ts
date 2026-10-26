/**
 * 3D parity (§12.3): legacy single-file viewer vs. the ported viewer.
 *  - 3 configurations × 6 views: canvas pixels, diff ≤ 2 % per pair
 *  - every component: spec values compared as text (RU, normalized)
 *
 * Both pages get the same canvas size and the same scene colour tokens. The animated layers
 * (airflow particles, water beads) are switched off for the pixel comparison because their
 * positions depend on elapsed time; all static geometry is compared.
 * The legacy page loads Three.js r128 from a CDN — requests are served from node_modules.
 */
import { test, expect, type Page } from '@playwright/test';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { COMPONENTS, AVAILABLE_IN } from '../../src/data/cabinet/components.ts';

const ROOT = process.cwd();
const OUT = resolve(ROOT, 'test-results/parity');
const THREE_MIN = readFileSync(resolve(ROOT, 'node_modules/three/build/three.min.js'));
const ORBIT = readFileSync(resolve(ROOT, 'node_modules/three/examples/js/controls/OrbitControls.js'));

// legacy/ is removed after parity was verified (brief §1). To re-run: `git show 660c6d9:legacy/index.html > legacy/index.html`.
test.skip(!existsSync(resolve(ROOT, 'legacy/index.html')), 'legacy/index.html not present');

const SCENE_VARS = `--scene:#0c0f0d!important;--floor:#141915!important;--ground:#1b211c!important;--wall:#3b4540!important;--grid:#242c27!important;--muted:#9aa39c!important;--ink:#ecf0ea!important;`;
const LEGACY_CSS = `:root,:root[data-theme]{${SCENE_VARS}}
.stage{grid-template-columns:1000px 380px!important}.viewer{width:1000px!important;height:640px!important}
#markers,.legend,.hint{display:none!important}`;
const NEW_CSS = `.cab-stage{${SCENE_VARS}width:1000px!important;height:640px!important;min-height:0!important;border:0!important}
.cab-grid{grid-template-columns:1000px 380px!important}.cab-markers,.cab-legend,.cab-hint{display:none!important}`;

const CONFIGS = ['M', 'L', 'P0'] as const;
const VIEWS = ['iso', 'front', 'rear', 'top', 'rack', 'system'] as const;

type Api = {
  setConfig(c: string): void;
  setView(v: string, i?: boolean): void;
  setLayer(l: string, on: boolean): void;
  select(id: string | null, fly?: boolean): void;
};

async function openLegacy(page: Page) {
  await page.route(/three\.min\.js$/, (r) =>
    r.fulfill({ body: THREE_MIN, contentType: 'application/javascript' }),
  );
  await page.route(/OrbitControls\.js$/, (r) =>
    r.fulfill({ body: ORBIT, contentType: 'application/javascript' }),
  );
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`file://${resolve(ROOT, 'legacy/index.html')}#cabinet`);
  await page.waitForFunction(() => 'GGM' in window);
  await page.addStyleTag({ content: LEGACY_CSS });
  // re-run legacy applyTheme() (MutationObserver on data-theme) so the injected scene colours apply
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.evaluate(() => {
    const g = (window as unknown as { GGM: Api }).GGM;
    g.setLayer('air', false);
    g.setLayer('water', false);
  });
}

async function openNew(page: Page) {
  await page.goto('?lang=ru&e2e#modell');
  await page.waitForFunction(() => '__ggm' in window, null, { timeout: 60_000 });
  await page.addStyleTag({ content: NEW_CSS });
  // the ported viewer renders on demand and pauses off-screen — keep the stage in view
  await page.evaluate(() => document.querySelector('.cab-stage')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const g = (window as unknown as { __ggm: Api }).__ggm;
    g.setLayer('air', false);
    g.setLayer('water', false);
  });
}

async function shot(page: Page, legacy: boolean, config: string, view: string): Promise<string> {
  await page.evaluate(
    ([c, v, l]) => {
      const g = (
        l ? (window as unknown as { GGM: Api }).GGM : (window as unknown as { __ggm: Api }).__ggm
      ) as Api;
      g.setConfig(c as string);
      g.setView(v as string, true);
    },
    [config, view, legacy] as const,
  );
  await page.waitForTimeout(900);
  return page.evaluate(
    (sel) => (document.querySelector(sel) as HTMLCanvasElement).toDataURL('image/png'),
    legacy ? '#c' : '.cab-canvas',
  );
}

async function diff(page: Page, a: string, b: string) {
  return page.evaluate(
    async ([a, b]) => {
      const load = (src: string) =>
        new Promise<HTMLImageElement>((res) => {
          const i = new Image();
          i.onload = () => res(i);
          i.src = src;
        });
      const [ia, ib] = await Promise.all([load(a as string), load(b as string)]);
      const w = Math.min(ia.width, ib.width);
      const h = Math.min(ia.height, ib.height);
      const ctx = (c: HTMLImageElement) => {
        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        const x = cv.getContext('2d') as CanvasRenderingContext2D;
        x.drawImage(c, 0, 0);
        return x.getImageData(0, 0, w, h).data;
      };
      const da = ctx(ia);
      const db = ctx(ib);
      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      const ox = out.getContext('2d') as CanvasRenderingContext2D;
      const od = ox.createImageData(w, h);
      let bad = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.max(
          Math.abs((da[i] ?? 0) - (db[i] ?? 0)),
          Math.abs((da[i + 1] ?? 0) - (db[i + 1] ?? 0)),
          Math.abs((da[i + 2] ?? 0) - (db[i + 2] ?? 0)),
        );
        const miss = d > 32;
        if (miss) bad++;
        od.data[i] = miss ? 255 : (da[i] ?? 0) / 4;
        od.data[i + 1] = miss ? 40 : (da[i + 1] ?? 0) / 4;
        od.data[i + 2] = miss ? 40 : (da[i + 2] ?? 0) / 4;
        od.data[i + 3] = 255;
      }
      ox.putImageData(od, 0, 0);
      return {
        ratio: bad / (w * h),
        size: [ia.width, ia.height, ib.width, ib.height],
        img: out.toDataURL('image/png'),
      };
    },
    [a, b] as const,
  );
}

test('3D parity: 3 configurations × 6 views, pixel diff ≤ 2 %', async ({ browser }) => {
  mkdirSync(OUT, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const legacy = await ctx.newPage();
  const next = await ctx.newPage();
  await openLegacy(legacy);
  await openNew(next);
  const results: string[] = [];
  for (const c of CONFIGS) {
    for (const v of VIEWS) {
      const a = await shot(legacy, true, c, v);
      const b = await shot(next, false, c, v);
      const d = await diff(next, a, b);
      results.push(`${c}/${v}: ${(d.ratio * 100).toFixed(2)} %`);
      writeFileSync(resolve(OUT, `${c}-${v}-diff.png`), Buffer.from(d.img.split(',')[1] ?? '', 'base64'));
      if (d.ratio > 0.02) {
        writeFileSync(resolve(OUT, `${c}-${v}-legacy.png`), Buffer.from(a.split(',')[1] ?? '', 'base64'));
        writeFileSync(resolve(OUT, `${c}-${v}-new.png`), Buffer.from(b.split(',')[1] ?? '', 'base64'));
      }
      expect.soft(d.size[0], `${c}/${v} width`).toBe(d.size[2]);
      expect.soft(d.ratio, `${c}/${v} pixel diff`).toBeLessThanOrEqual(0.02);
    }
  }
  writeFileSync(resolve(OUT, 'summary.txt'), results.join('\n') + '\n');
  console.log(results.join('\n'));
  await ctx.close();
});

/** Rows intentionally different from legacy, with the reason (claims policy / brief). */
const EXPECTED_DIFF: Record<string, string> = {
  'hrx|ОКУПАЕМОСТЬ': 'payback figure removed — brief §2.2 (4): no payback/ROI on the site',
  'uplink|СКОРОСТЬОТДАЧИПЛОЩАДКИ': 'internal niche code "П1" replaced by a neutral description',
  'pipes|РАСХОД': 'tag ОЦ added — brief §2.3 (coolant flow is an estimate for ΔT 5 K)',
};

const norm = (s: string) =>
  s
    .replace(/[\s\u00a0\u202f]+/g, '')
    .replace(/мм/g, 'mm')
    .replace(/м³\/ч/g, 'm³/h')
    .replace(/л\/мин/g, 'l/min')
    .replace(/(\d)мин/g, '$1min')
    .replace(/(\d)кг/g, '$1kg')
    .replace(/(\d)м(?![а-яё])/g, '$1m')
    .replace(/(\d)с(?![а-яё])/g, '$1s')
    .toUpperCase();

test('3D parity: every component shows the same spec values (RU)', async ({ browser }) => {
  test.setTimeout(600_000); // software WebGL in CI: each selection re-renders both scenes
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const legacy = await ctx.newPage();
  const next = await ctx.newPage();
  await openLegacy(legacy);
  await openNew(next);
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const comp of COMPONENTS) {
    const config = AVAILABLE_IN[comp.id]?.[0] ?? 'L';
    const a = await legacy.evaluate(
      ([id, c]) => {
        const g = (window as unknown as { GGM: Api }).GGM;
        g.setConfig(c as string);
        g.select(id as string, false);
        return [...document.querySelectorAll('#selCard table.kv tr')].map((tr) => [
          (tr.children[0] as HTMLElement).innerText,
          (tr.children[1] as HTMLElement).innerText,
        ]);
      },
      [comp.id, config] as const,
    );
    await next
      .locator('.cab-toolbar .seg')
      .first()
      .locator('button')
      .nth(['M', 'L', 'P0'].indexOf(config))
      .click();
    await next.evaluate((id) => (window as unknown as { __ggm: Api }).__ggm.select(id), comp.id);
    await next.waitForSelector(`.cab-card-inner[data-comp="${comp.id}"]`);
    const b = await next.evaluate(() =>
      [...document.querySelectorAll('.cab-card .spec-row')].map((row) => {
        const clone = row.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('.sr-only').forEach((e) => e.remove());
        document.body.appendChild(clone);
        const out = [
          (clone.children[0] as HTMLElement).innerText,
          (clone.children[1] as HTMLElement).innerText,
        ];
        clone.remove();
        return out;
      }),
    );
    const map = new Map(b.map(([l, v]) => [norm(l ?? ''), norm(v ?? '')]));
    for (const [label, value] of a) {
      const key = `${comp.id}|${norm(label ?? '')}`;
      if (key in EXPECTED_DIFF) {
        seen.add(key);
        continue;
      }
      const got = map.get(norm(label ?? ''));
      if (got !== norm(value ?? '')) problems.push(`${comp.id} "${label}": legacy "${value}" ≠ new "${got}"`);
    }
  }
  expect(problems, problems.join('\n')).toEqual([]);
  expect([...seen].sort()).toEqual(Object.keys(EXPECTED_DIFF).sort());
  await ctx.close();
});
