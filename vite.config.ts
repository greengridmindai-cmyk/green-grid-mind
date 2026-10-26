import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { FORM_ENDPOINT } from './src/config.ts';

const root = import.meta.dirname;

function gitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim();
  } catch {
    return 'local';
  }
}

/**
 * Build-time HTML hardening:
 * - Content-Security-Policy meta with the sha256 of the inline language bootstrap
 * - preload for the Manrope latin woff2 that the bundle actually emitted
 */
function htmlHardening(): Plugin {
  return {
    name: 'ggm-html-hardening',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
          (m) =>
            `'sha256-${createHash('sha256')
              .update(m[1] ?? '')
              .digest('base64')}'`,
        );
        let connect = "'self'";
        if (FORM_ENDPOINT) connect += ` ${new URL(FORM_ENDPOINT).origin}`;
        const csp = [
          "default-src 'self'",
          "img-src 'self' data:",
          "media-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          `script-src 'self' ${hashes.join(' ')}`,
          `connect-src ${connect}`,
          "base-uri 'self'",
          "form-action 'self'",
          "object-src 'none'",
        ].join('; ');
        const font = Object.keys(ctx.bundle ?? {}).find((f) => /manrope-latin-wght-normal.*\.woff2$/.test(f));
        const tags = [`<meta http-equiv="Content-Security-Policy" content="${csp}">`];
        if (font) {
          tags.push(
            `<link rel="preload" href="/green-grid-mind/${font}" as="font" type="font/woff2" crossorigin>`,
          );
        }
        return html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n    ${tags.join('\n    ')}`);
      },
    },
  };
}

export default defineConfig({
  base: '/green-grid-mind/',
  plugins: [react(), tailwindcss(), htmlHardening()],
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
    __GIT_SHA__: JSON.stringify(gitSha()),
    __HAS_HERO_VIDEO__: JSON.stringify(existsSync(resolve(root, 'public/media/hero.mp4'))),
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        impressum: resolve(root, 'impressum/index.html'),
        datenschutz: resolve(root, 'datenschutz/index.html'),
        notFound: resolve(root, '404.html'),
      },
    },
  },
});
