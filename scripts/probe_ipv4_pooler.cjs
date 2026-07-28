const pg = require('pg');

const projectRef = "ychwhxkxsxmuvabxlyjn";
const passwords = ["Britney", "mira-admin-2024"];
const host = "15.188.134.6"; // eu-west-3 pooler IPv4

async function probe() {
    for (const password of passwords) {
        const connectionString = `postgres://postgres.${projectRef}:${password}@${host}:6543/postgres`;
        console.log(`📡 Probing IP ${host} with password...`);
        const client = new pg.Client({ connectionString });
        try {
            await client.connect();
            console.log("✅ SUCCESS!");
            const res = await client.query('SELECT count(*) FROM public.profiles');
            console.log(`📊 Profiles: ${res.rows[0].count}`);
            await client.end();
            process.exit(0);
        } catch (err) {
            console.error("❌ Failed:", err.message);
        }
    }
}

probe();
