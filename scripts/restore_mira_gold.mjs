import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '../backups/gold_master_v6.6');
const COMPONENTS_DIR = path.join(__dirname, '../components');
const SRC_DIR = path.join(__dirname, '../src');

console.log('🚀 MIRA: Iniciando Restauro de Soberania (Gold Master v6.6)...');

async function restore() {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            console.error('❌ ERRO: Backup não encontrado em ' + BACKUP_DIR);
            process.exit(1);
        }

        const files = fs.readdirSync(BACKUP_DIR);
        
        for (const file of files) {
            const source = path.join(BACKUP_DIR, file);
            let dest;

            if (file === 'App.tsx') {
                dest = path.join(SRC_DIR, file);
            } else {
                dest = path.join(COMPONENTS_DIR, file);
            }

            fs.copyFileSync(source, dest);
            console.log(`✅ Restaurado: ${file} -> ${dest}`);
        }

        console.log('\n💎 MIRA: Design "Gold Master" restaurado a 100%! Podes celebrar, CEO.');
    } catch (error) {
        console.error('❌ FALHA NO RESTAURO:', error.message);
    }
}

restore();
