const fs = require('fs');
const path = require('path');

const backupPath = 'c:\\Users\\AmandaAbreu\\mira\\backups\\backup_2026-03-29.json';

try {
    const rawData = fs.readFileSync(backupPath, 'utf8');
    const data = JSON.parse(rawData);

    if (data.tables && data.tables.saber_ia) {
        const saberIaData = data.tables.saber_ia;
        console.log(`Found ${saberIaData.length} Saber IA entries.`);
        
        fs.writeFileSync('saber_ia_extracted.json', JSON.stringify(saberIaData, null, 2), 'utf8');
        
        const missingCategories = saberIaData.filter(d => !d.category || d.category === 'null');
        console.log(`Entries missing category: ${missingCategories.length}`);
    } else {
        console.log("Saber IA table not found in backup.");
    }
} catch (err) {
    console.error("Error:", err.message);
}
