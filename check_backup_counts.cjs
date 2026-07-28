const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('backups/backup_2026-04-05.json', 'utf8'));

console.log('Keys in backup:', Object.keys(backup));
if (backup.tables) {
  Object.keys(backup.tables).forEach(table => {
    console.log(`Table ${table}: ${backup.tables[table].length} items`);
  });
} else {
  console.log('No tables key found.');
}
