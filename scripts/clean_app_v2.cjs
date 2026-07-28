const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
// Apagar as linhas 39 a 57 que ficaram soltas
const filtered = lines.filter((_, i) => (i + 1 < 39 || i + 1 > 57));
fs.writeFileSync('src/App.tsx', filtered.join('\n'));
console.log('✅ App.tsx code orphans removed.');
