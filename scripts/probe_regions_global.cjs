const pg = require('pg');

const projectRef = "ychwhxkxsxmuvabxlyjn";
const password = "mira-admin-2024";
const regions = ["us-east-1", "us-east-2", "us-west-1", "ap-southeast-1"];

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
