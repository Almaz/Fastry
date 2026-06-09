// Генерирует поисковый индекс Pagefind после сборки
// Запускается автоматически после `astro build`
//
// Astro 6 при использовании actions/configure-pages@v5 может сложить
// сборку в dist/client/ вместо dist/. Проверяем оба варианта.
//
// Также копирует pagefind.js в public/pagefind/ для работы в dev-режиме.

import { execSync } from 'child_process';
import { existsSync, cpSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

// Возможные директории со сборкой (в порядке приоритета)
const possibleDirs = ['dist/client', 'dist'];

const siteDir = possibleDirs.find((dir) => existsSync(dir));

if (siteDir) {
  console.log('[pagefind] Generating search index from', siteDir, '...');
  try {
    execSync('npx pagefind --site ' + siteDir, {
      stdio: 'inherit',
    });
    console.log('[pagefind] Search index generated successfully!');

    // Копируем pagefind/ в public/ для dev-режима
    const pagefindDir = join(siteDir, 'pagefind');
    const publicPagefindDir = 'public/pagefind';

    if (existsSync(pagefindDir)) {
      // Удаляем старую версию в public/, если есть
      if (existsSync(publicPagefindDir)) {
        execSync('rm -rf ' + publicPagefindDir);
      }

      // Копируем
      mkdirSync(publicPagefindDir, { recursive: true });
      cpSync(pagefindDir, publicPagefindDir, { recursive: true });
      console.log('[pagefind] Copied to', publicPagefindDir, 'for dev mode');
    }
  } catch (error) {
    console.error('[pagefind] Failed to generate search index:', error.message);
    process.exit(1);
  }
} else {
  console.error('[pagefind] Site directory not found — checked:', possibleDirs.join(', '));
  process.exit(1);
}