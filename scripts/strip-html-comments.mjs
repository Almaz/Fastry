import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, extname } from 'path';

const distDir = new URL('../dist/', import.meta.url).pathname;

// Regexes for different comment types
const htmlCommentRegex = /<!--[\s\S]*?-->/g;
const blockCommentRegex = /\/\*[\s\S]*?\*\//g;

// Strip HTML comments (<!-- -->) and JS/CSS block comments (/* */)
// from built HTML files. HTML comments are stripped everywhere.
// Block comments are stripped only inside <script> and <style> tags.
function stripAllComments(html) {
  // Split by script/style tags to apply different regexes
  const tagRegex = /<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>/gi;
  let lastIndex = 0;
  const parts = [];
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    // HTML comments before this tag
    const before = html.slice(lastIndex, match.index).replace(htmlCommentRegex, '');
    parts.push(before);

    // Inside script/style: find the opening > and closing </tag>
    const fullTag = match[0];
    const tagName = fullTag.startsWith('<script') ? 'script' : 'style';
    const closeIdx = fullTag.toLowerCase().lastIndexOf(`</${tagName}>`);
    const openEnd = fullTag.indexOf('>') + 1;
    const inner = fullTag.slice(openEnd, closeIdx);
    const outerOpen = fullTag.slice(0, openEnd);
    const outerClose = fullTag.slice(closeIdx);
    const strippedInner = inner.replace(blockCommentRegex, '');
    parts.push(outerOpen + strippedInner + outerClose);

    lastIndex = match.index + fullTag.length;
  }

  // Remaining after last tag
  const after = html.slice(lastIndex).replace(htmlCommentRegex, '');
  parts.push(after);

  const result = parts.join('');

  // Remove empty lines and collapse whitespace inside script/style tags
  var minified = result.replace(/^[ \t]*[\r\n]+/gm, '');
  // Collapse consecutive spaces inside script/style tags to single space
  minified = minified.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script\s*>)/gi, function(match, open, code, close) {
    return open + code.replace(/\s{2,}/g, ' ') + close;
  });
  minified = minified.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi, function(match, open, code, close) {
    return open + code.replace(/\s{2,}/g, ' ') + close;
  });
  return minified;
}

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && extname(fullPath) === '.html') {
      const content = readFileSync(fullPath, 'utf-8');
      const stripped = stripAllComments(content);
      if (stripped.length !== content.length) {
        writeFileSync(fullPath, stripped, 'utf-8');
        console.log(`  ✅ Stripped all: ${fullPath.replace(distDir, '')}`);
      }
    }
  }
}

console.log('🗑️  Stripping HTML comments and JS/CSS block comments from dist/...');
walk(distDir);
console.log('✅ Done!');
