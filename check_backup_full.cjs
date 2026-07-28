const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('backups/backup_2026-04-05.json', 'utf8'));

console.log('Tables in backup:');
if (backup.tables) {
    for (const [name, data] of Object.entries(backup.tables)) {
        console.log(`- ${name}: ${data.length} items`);
    }
}
