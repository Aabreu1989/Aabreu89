const fs = require('fs');
const path = 'utils/translations.ts';
let content = fs.readFileSync(path, 'utf8');

// Find all language blocks
const blocks = content.match(/(\w+):\s*\{([\s\S]*?)\}/g);
if (blocks) {
    for (let block of blocks) {
        let lang = block.match(/(\w+):\s*\{/)[1];
        let inner = block.match(/\{([\s\S]*?)\}/)[1];
        let lines = inner.split('\n');
        let keys = new Set();
        let newLines = [];
        let duplicatesCount = 0;
        for (let line of lines) {
            let keyMatch = line.match(/"(.*?)"\s*:/);
            if (keyMatch) {
                let key = keyMatch[1];
                if (keys.has(key)) {
                    duplicatesCount++;
                    continue;
                }
                keys.add(key);
            }
            newLines.push(line);
        }
        if (duplicatesCount > 0) {
            console.log(`Found ${duplicatesCount} duplicates in ${lang}`);
            let newInner = newLines.join('\n');
            content = content.replace(inner, newInner);
        }
    }
    fs.writeFileSync(path, content, 'utf8');
} else {
    console.log('No blocks found.');
}
