/**
 * copy-fonts.mjs
 *
 * Copies woff2 font files from @fontsource-variable packages into public/fonts/
 * so they are served from /fonts/* instead of /_astro/*.
 *
 * Vercel applies a hard-coded 10-minute Cache-Control to all /_astro/* assets
 * that overrides vercel.json, public/_headers, and @astrojs/vercel cacheControl.
 * By hosting fonts under /fonts/* we can set a proper long-lived cache header
 * via vercel.json (already configured: max-age=31536000, immutable).
 *
 * Run: node scripts/copy-fonts.mjs
 * Integrated into: pnpm build (runs before astro build)
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_FONTS = join(ROOT, 'public', 'fonts');

// Font packages we use — only copy subsets that actually exist in files/
const FONT_PACKAGES = [
  { name: 'inter', pkg: '@fontsource-variable/inter' },
  { name: 'manrope', pkg: '@fontsource-variable/manrope' },
  { name: 'jetbrains-mono', pkg: '@fontsource-variable/jetbrains-mono' },
];

function copyFonts() {
  console.log('[copy-fonts] Copying woff2 files to public/fonts/...');

  if (!existsSync(PUBLIC_FONTS)) {
    mkdirSync(PUBLIC_FONTS, { recursive: true });
  }

  for (const { name, pkg } of FONT_PACKAGES) {
    const filesDir = join(ROOT, 'node_modules', pkg, 'files');
    if (!existsSync(filesDir)) {
      console.warn(`[copy-fonts] WARNING: ${filesDir} not found, skipping`);
      continue;
    }

    const entries = readdirSync(filesDir);
    let count = 0;
    for (const entry of entries) {
      if (!entry.endsWith('.woff2')) continue;
      const src = join(filesDir, entry);
      const dest = join(PUBLIC_FONTS, entry);
      copyFileSync(src, dest);
      count++;
    }
    console.log(`[copy-fonts]   ${name}: ${count} files copied`);
  }

  console.log('[copy-fonts] Done.');
}

copyFonts();