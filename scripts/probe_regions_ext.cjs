const pg = require('pg');

const projectRef = "ychwhxkxsxmuvabxlyjn";
const password = "Britney";
const regions = ["eu-west-1", "eu-west-2", "eu-north-1", "me-central-1"];

async function probe() {
    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        const connectionString = `postgres://postgres.${projectRef}:${password}@${host}:6543/postgres`;
        
        console.log(`📡 Probing ${region}...`);
        const client = new pg.Client({ connectionString, connectionTimeoutMillis: 3000 });
        
        try {
            await client.connect();
            console.log(`✅ SUCCESS in ${region}!`);
            await client.end();
            process.exit(0);
        } catch (err) {
            console.error(`❌ Failed in ${region}:`, err.message);
        }
    }
}

probe();
