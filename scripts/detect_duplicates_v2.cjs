const fs = require('fs');

const content = fs.readFileSync('src/utils/translations.ts', 'utf8');
const lines = content.split('\n');

let currentLang = '';
const langKeys = {};

lines.forEach((line, index) => {
    const langMatch = line.match(/^\s*([a-z]{2}):\s*\{/);
    if (langMatch) {
        currentLang = langMatch[1];
        langKeys[currentLang] = {};
        return;
    }

    const keyMatch = line.match(/^\s*"([^"]+)"\s*:/);
    if (keyMatch && currentLang) {
        const key = keyMatch[1];
        if (langKeys[currentLang][key]) {
            console.log(`Duplicate key "${key}" in language "${currentLang}" at line ${index + 1} (previous at line ${langKeys[currentLang][key]})`);
        }
        langKeys[currentLang][key] = index + 1;
    }
});
