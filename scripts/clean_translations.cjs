const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/utils/translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Use a simple state machine to find the objects and deduplicate keys
// This is specific to the MIRA translations.ts structure
function deduplicateKeys(langCode) {
    const startMarker = `${langCode}: {`;
    const startIndex = content.indexOf(startMarker);
    if (startIndex === -1) return;

    let braceCount = 0;
    let endIndex = -1;
    for (let i = startIndex + startMarker.length - 1; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
                endIndex = i;
                break;
            }
        }
    }

    if (endIndex === -1) return;

    const objectContent = content.substring(startIndex + startMarker.length, endIndex);
    const lines = objectContent.split('\n');
    const seenKeys = new Set();
    const newLines = [];

    // Process from bottom to top to keep the LATEST definition if there are duplicates
    // Actually, usually the first one is the intended one in these manual merges. 
    // But let's just keep the FIRST one we encounter (top to bottom).
    for (const line of lines) {
        const match = line.match(/^\s*"([^"]+)":/);
        if (match) {
            const key = match[1];
            if (seenKeys.has(key)) {
                console.log(`🗑️ Removing duplicate key: ${langCode}.${key}`);
                continue; 
            }
            seenKeys.add(key);
        }
        newLines.push(line);
    }

    const newObjectContent = newLines.join('\n');
    content = content.substring(0, startIndex + startMarker.length) + newObjectContent + content.substring(endIndex);
}

['pt', 'en', 'es', 'fr'].forEach(deduplicateKeys);

fs.writeFileSync(filePath, content);
console.log("✅ Translations cleaned and deduplicated.");
