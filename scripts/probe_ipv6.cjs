const pg = require('pg');

const projectRef = "ychwhxkxsxmuvabxlyjn";
const password = "Britney";
const ipv6 = "2600:1f13:838:6e38:d329:f4d2:d99d:7822";

async function probe() {
    const connectionString = `postgres://postgres:${password}@[${ipv6}]:5432/postgres`;
    console.log(`📡 Probing IPv6 [${ipv6}]...`);
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
