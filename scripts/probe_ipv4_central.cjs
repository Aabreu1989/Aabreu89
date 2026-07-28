const pg = require('pg');

const projectRef = "ychwhxkxsxmuvabxlyjn";
const password = "Britney";
const host = "52.59.152.35"; // eu-central-1 pooler IPv4

async function probe() {
    const connectionString = `postgres://postgres.${projectRef}:${password}@${host}:6543/postgres`;
    console.log(`📡 Probing IP ${host}...`);
    const client = new pg.Client({ connectionString });
    try {
        await client.connect();
        console.log("✅ SUCCESS!");
        const res = await client.query('SELECT count(*) FROM public.profiles');
        console.log(`📊 Profiles: ${res.rows[0].count}`);
        await client.end();
    } catch (err) {
        console.error("❌ Failed:", err.message);
    }
}

probe();
