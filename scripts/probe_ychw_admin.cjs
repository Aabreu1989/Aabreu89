const pg = require('pg');

const connectionString = "postgres://postgres.ychwhxkxsxmuvabxlyjn:mira-admin-2024@aws-0-eu-west-3.pooler.supabase.com:6543/postgres";

async function probe() {
    console.log("📡 Probing ychw via Pooler with admin password...");
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
