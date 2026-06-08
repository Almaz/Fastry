// Генерирует поисковый индекс Pagefind после сборки
// Запускается автоматически после `astro build`

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const siteDir = 'dist/client';

// Запускаем Pagefind только если есть собранный сайт
if (existsSync(siteDir)) {
  console.log('[pagefind] Generating search index from', siteDir, '...');
  try {
    execSync('npx pagefind --site ' + siteDir, {
      stdio: 'inherit',
    });
    console.log('[pagefind] Search index generated successfully!');
  } catch (error) {
    console.error('[pagefind] Failed to generate search index:', error.message);
    process.exit(1);
  }
} else {
  console.log('[pagefind] Site directory not found at', siteDir, '— skipping search index generation.');
}