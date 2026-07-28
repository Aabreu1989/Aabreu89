const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
const filtered = lines.filter((_, i) => (i + 1 < 39 || i + 1 > 78));
fs.writeFileSync('src/App.tsx', filtered.join('\n'));
console.log('✅ App.tsx cleaned.');
