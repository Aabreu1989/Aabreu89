const pg = require('pg');

const projectRef = "ychwhxkxsxmuvabxlyjn";
const password = "Britney";

async function probe() {
    const host = `db.${projectRef}.supabase.co`;
    const connectionString = `postgres://postgres:${password}@${host}:5432/postgres`;
    
    console.log(`📡 Probing direct host (${host})...`);
    const client = new pg.Client({ connectionString, connectionTimeoutMillis: 10000 });
    
    try {
        await client.connect();
        console.log(`✅ SUCCESS!`);
        const res = await client.query('SELECT count(*) FROM public.profiles');
        console.log(`📊 Profiles: ${res.rows[0].count}`);
        await client.end();
    } catch (err) {
        console.error(`❌ Failed:`, err.message);
    }
}

probe();
