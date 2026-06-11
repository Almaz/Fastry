/**
 * copy-fonts.mjs
 *
 * Copies woff2 font files from @fontsource-variable packages into public/fonts/.
 * Only the subsets actually used on the site are copied (see static-fonts.css).
 *
 * Also duplicates font files into dist/_astro/ at build time so they get
 * content-hashed filenames and can be cached permanently by the browser.
 *
 * Run: node scripts/copy-fonts.mjs
 * Integrated into: pnpm build (runs before astro build)
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
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

// Only these subset files are actually declared in @font-face rules
const ALLOWED_FILES = new Set([
  'inter-cyrillic-wght-normal.woff2',
  'inter-latin-wght-normal.woff2',
  'manrope-cyrillic-wght-normal.woff2',
  'manrope-latin-wght-normal.woff2',
  'jetbrains-mono-cyrillic-wght-normal.woff2',
  'jetbrains-mono-cyrillic-wght-italic.woff2',
  'jetbrains-mono-latin-wght-normal.woff2',
  'jetbrains-mono-latin-wght-italic.woff2',
]);

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
      if (!ALLOWED_FILES.has(entry)) {
        console.log(`[copy-fonts]   skipping ${entry} (not in ALLOWED_FILES)`);
        continue;
      }
      const src = join(filesDir, entry);
      const dest = join(PUBLIC_FONTS, entry);
      copyFileSync(src, dest);
      count++;
    }
    console.log(`[copy-fonts]   ${name}: ${count} files copied`);
  }

  // Also copy fonts to dist/_astro/ so they get content-hashed URLs on GitHub Pages
  const distAstro = join(ROOT, 'dist', '_astro');
  if (existsSync(join(ROOT, 'dist'))) {
    console.log('[copy-fonts] Copying fonts to dist/_astro/ for content-hashed caching...');
    if (!existsSync(distAstro)) {
      mkdirSync(distAstro, { recursive: true });
    }
    const entries = readdirSync(PUBLIC_FONTS);
    let count = 0;
    for (const entry of entries) {
      if (!entry.endsWith('.woff2')) continue;
      const src = join(PUBLIC_FONTS, entry);
      const dest = join(distAstro, entry);
      copyFileSync(src, dest);
      count++;
    }
    console.log(`[copy-fonts]   ${count} files copied to dist/_astro/`);
  }

  console.log('[copy-fonts] Done.');
}

copyFonts();