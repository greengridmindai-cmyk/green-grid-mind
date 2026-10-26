// Renders public/og-image.png (1200×630) and public/apple-touch-icon.png (180×180) from scripts/og/template.html.
import { chromium } from 'playwright';
import { resolve } from 'node:path';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.goto(`file://${resolve('scripts/og/template.html')}`);
await page.evaluate(() => document.fonts.ready);
await page.locator('#og').screenshot({ path: 'public/og-image.png' });
await page.locator('#icon').screenshot({ path: 'public/apple-touch-icon.png' });
await browser.close();
console.log('og-image.png, apple-touch-icon.png written');
