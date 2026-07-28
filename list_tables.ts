
import pg from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

const envPath = 'c:/Users/AmandaAbreu/mira/.env.local';
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const supabaseUrl = envConfig.VITE_SUPABASE_URL || envConfig.SUPABASE_URL;
const projectRef = supabaseUrl.split('//')[1].split('.')[0];
const connectionString = `postgres://postgres.${projectRef}:mira-admin-2024@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`;

async function listTables() {
    const client = new pg.Client({ connectionString });
    try {
        await client.connect();
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("TABLES IN DB:");
        res.rows.forEach(r => console.log(`- ${r.table_name}`));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
listTables();
