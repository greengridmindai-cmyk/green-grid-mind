/**
 * 3D model regression: canvas snapshots of 3 configurations × 6 views compared with the
 * approved baselines in tests/e2e/model-baselines/ (≤ 0.5 % differing pixels).
 *
 * After an INTENDED model change (new revision document):
 *   UPDATE_BASELINES=1 npx playwright test tests/e2e/model.spec.ts
 * then review the new PNGs (git diff shows them) and commit them together with the model change.
 *
 * Animated layers (airflow particles, water beads) are switched off — their positions depend on time.
 */
import { test, expect, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DIR = resolve(process.cwd(), 'tests/e2e/model-baselines');
const OUT = resolve(process.cwd(), 'test-results/model');
const UPDATE = !!process.env.UPDATE_BASELINES;
const CONFIGS = ['M', 'L', 'P0'] as const;
const VIEWS = ['iso', 'front', 'rear', 'top', 'rack', 'system'] as const;
const MAX_DIFF = 0.005;

type Api = {
  setConfig(c: string): void;
  setView(v: string, i?: boolean): void;
  setLayer(l: string, on: boolean): void;
};

async function open(page: Page) {
  await page.goto('?lang=de&e2e#modell');
  await page.waitForFunction(() => '__ggm' in window, null, { timeout: 90_000 });
  await page.addStyleTag({
    content:
      '.cab-stage{width:1000px!important;height:640px!important;min-height:0!important;border:0!important}.cab-grid{grid-template-columns:1000px 380px!important}.cab-markers,.cab-legend,.cab-hint{display:none!important}',
  });
  await page.evaluate(() => document.querySelector('.cab-stage')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const g = (window as unknown as { __ggm: Api }).__ggm;
    g.setLayer('air', false);
    g.setLayer('water', false);
  });
}

async function snap(page: Page, c: string, v: string) {
  await page.evaluate(
    ([c, v]) => {
      const g = (window as unknown as { __ggm: Api }).__ggm;
      g.setConfig(c as string);
      g.setView(v as string, true);
    },
    [c, v] as const,
  );
  await page.waitForTimeout(700);
  return page.evaluate(() =>
    (document.querySelector('.cab-canvas') as HTMLCanvasElement).toDataURL('image/png'),
  );
}

function diff(page: Page, a: string, b: string) {
  return page.evaluate(
    async ([a, b]) => {
      const load = (src: string) =>
        new Promise<HTMLImageElement>((res) => {
          const i = new Image();
          i.onload = () => res(i);
          i.src = src;
        });
      const [ia, ib] = await Promise.all([load(a as string), load(b as string)]);
      if (ia.width !== ib.width || ia.height !== ib.height) return 1;
      const px = (img: HTMLImageElement) => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const x = c.getContext('2d') as CanvasRenderingContext2D;
        x.drawImage(img, 0, 0);
        return x.getImageData(0, 0, c.width, c.height).data;
      };
      const da = px(ia);
      const db = px(ib);
      let bad = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.max(
          Math.abs((da[i] ?? 0) - (db[i] ?? 0)),
          Math.abs((da[i + 1] ?? 0) - (db[i + 1] ?? 0)),
          Math.abs((da[i + 2] ?? 0) - (db[i + 2] ?? 0)),
        );
        if (d > 32) bad++;
      }
      return bad / (ia.width * ia.height);
    },
    [a, b] as const,
  );
}

test('3D model matches approved baselines (3 configurations × 6 views)', async ({ page }) => {
  test.setTimeout(240_000);
  mkdirSync(DIR, { recursive: true });
  mkdirSync(OUT, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const report: string[] = [];
  for (const c of CONFIGS)
    for (const v of VIEWS) {
      const png = await snap(page, c, v);
      const file = resolve(DIR, `${c}-${v}.png`);
      const buf = Buffer.from(png.split(',')[1] ?? '', 'base64');
      if (UPDATE || !existsSync(file)) {
        writeFileSync(file, buf);
        report.push(`${c}/${v}: baseline written`);
        continue;
      }
      const base = `data:image/png;base64,${readFileSync(file).toString('base64')}`;
      const d = await diff(page, base, png);
      report.push(`${c}/${v}: ${(d * 100).toFixed(2)} %`);
      if (d > MAX_DIFF) writeFileSync(resolve(OUT, `${c}-${v}-actual.png`), buf);
      expect.soft(d, `${c}/${v} differs from baseline`).toBeLessThanOrEqual(MAX_DIFF);
    }
  writeFileSync(resolve(OUT, 'summary.txt'), report.join('\n') + '\n');
  console.log(report.join('\n'));
});
