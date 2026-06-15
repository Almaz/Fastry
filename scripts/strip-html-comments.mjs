import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, extname } from 'path';

const distDir = new URL('../dist/', import.meta.url).pathname;
const htmlRegex = /<!--[\s\S]*?-->/g;

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && extname(fullPath) === '.html') {
      const content = readFileSync(fullPath, 'utf-8');
      const stripped = content.replace(htmlRegex, '');
      if (stripped.length !== content.length) {
        writeFileSync(fullPath, stripped, 'utf-8');
        console.log(`  ✅ Stripped comments: ${fullPath.replace(distDir, '')}`);
      }
    }
  }
}

console.log('🗑️  Stripping HTML comments from dist/...');
walk(distDir);
console.log('✅ Done!');