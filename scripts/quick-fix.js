const fs = require('fs');
const filePath = require('path').join(__dirname, '..', 'src', 'pages', 'ru', 'projects', 'index.astro');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(
  /href=\{localizedPath\('\/projects\/' \+ project\.id\.replace\(\/ru\\\/\/\.\, ''\)\)\)/g,
  "href={'/ru/projects/' + project.id.replace(/ru\\///, '')}"
);
fs.writeFileSync(filePath, content);
console.log('Fixed!');