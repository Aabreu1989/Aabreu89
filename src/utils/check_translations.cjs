const fs = require('fs');
const path = require('path');

/**
 * Script para verificar a consistência das traduções no MIRA.
 * Compara as chaves entre as línguas suportadas (PT, EN, ES, FR).
 */

const translationsPath = path.join(__dirname, 'translations.ts');

if (!fs.existsSync(translationsPath)) {
    console.error('❌ Erro: translations.ts não encontrado em ' + translationsPath);
    process.exit(1);
}

const content = fs.readFileSync(translationsPath, 'utf8');

const languages = ['pt', 'en', 'es', 'fr'];
const keysByLang = {};

languages.forEach(lang => {
    // Encontrar o início do bloco da língua
    const startRegex = new RegExp(`^\\s+${lang}:\\s+\\{`, 'm');
    const startIndex = content.search(startRegex);
    
    if (startIndex === -1) {
        console.warn(`⚠️ Língua ${lang} não encontrada no ficheiro.`);
        return;
    }

    // Encontrar o fim do bloco de forma aproximada (até à próxima língua ou fim do objeto)
    let endIndex = content.length;
    languages.forEach(otherLang => {
        if (otherLang === lang) return;
        const otherRegex = new RegExp(`^\\s+${otherLang}:\\s+\\{`, 'm');
        const otherIndex = content.search(otherRegex);
        if (otherIndex > startIndex && otherIndex < endIndex) {
            endIndex = otherIndex;
        }
    });

    const block = content.substring(startIndex, endIndex);
    
    // Extrair as chaves: "chave": "valor"
    const keyRegex = /"([^"]+)":/g;
    const keys = new Set();
    let keyMatch;
    while ((keyMatch = keyRegex.exec(block)) !== null) {
        keys.add(keyMatch[1]);
    }
    keysByLang[lang] = keys;
});

// Análise
console.log('==============================================');
console.log('🛡️  MIRA TRANSLATION AUDIT V2026');
console.log('==============================================\n');

const allKeys = Array.from(new Set(
    Object.values(keysByLang).reduce((acc, set) => [...acc, ...Array.from(set)], [])
)).sort();

console.log(`📊 Estatísticas:`);
languages.forEach(lang => {
    const count = keysByLang[lang] ? keysByLang[lang].size : 0;
    const diff = allKeys.length - count;
    console.log(`   - ${lang.toUpperCase()}: ${count} chaves ${diff > 0 ? `(⚠️ -${diff})` : '(✅ Completo)'}`);
});

console.log(`\n🔍 Detalhes de Chaves em Falta:`);
let missingCount = 0;

allKeys.forEach(key => {
    const missingIn = languages.filter(lang => !keysByLang[lang] || !keysByLang[lang].has(key));
    if (missingIn.length > 0) {
        missingCount++;
        console.log(`   ❌ "${key}" -> Falta em: ${missingIn.join(', ').toUpperCase()}`);
    }
});

if (missingCount === 0) {
    console.log('   ✅ Todas as chaves estão sincronizadas entre todas as línguas.');
} else {
    console.log(`\n⚠️  Foram encontradas ${missingCount} chaves inconsistentes.`);
}

console.log('\n==============================================');
console.log('✅ Auditoria Concluída');
console.log('==============================================');
