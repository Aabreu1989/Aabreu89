const pg = require('pg');

const projectRef = "ychwhxkxsxmuvabxlyjn";
const password = "mira-admin-2024";
const host = "15.188.134.6"; // eu-west-3 pooler IPv4

async function probe() {
    const connectionString = `postgres://postgres.${projectRef}:${password}@${host}:5432/postgres`;
    console.log(`📡 Probing IP ${host} on port 5432...`);
    const client = new pg.Client({ connectionString });
    try {
        await client.connect();
        console.log("✅ SUCCESS!");
        await client.end();
    } catch (err) {
        console.error("❌ Failed:", err.message);
    }
}

probe();
