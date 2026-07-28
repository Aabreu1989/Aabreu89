
import fs from 'fs';
import path from 'path';

const OLD_ID = 'pnlzyshozpqlzuyjesdq';
const NEW_ID = 'pnlzyshozpqlzuyjesdq';

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== '.agent' && file !== 'dist') {
                walk(fullPath);
            }
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.cjs') || file.endsWith('.mjs') || file.endsWith('.json') || file.endsWith('.sql') || file.endsWith('.md') || file === '.env.local') {
                let content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes(OLD_ID)) {
                    console.log(`✨ Corrigindo: ${fullPath}`);
                    const newContent = content.split(OLD_ID).join(NEW_ID);
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                }
            }
        }
    }
}

console.log(`🚀 Iniciando Purga Global do ID Antigo (${OLD_ID} -> ${NEW_ID})...`);
walk('.');
console.log('✅ PROCESSO CONCLUÍDO. O MIRA ESTÁ AGORA 100% SOBERANO.');
