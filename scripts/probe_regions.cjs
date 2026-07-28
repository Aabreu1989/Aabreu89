const pg = require('pg');

const projectRef = "pnlzyshozpqlzuyjesdq";
const password = "Britney";
const regions = ["eu-west-3", "eu-central-1", "us-east-1"];

async function probe() {
    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        const connectionString = `postgres://postgres.${projectRef}:${password}@${host}:6543/postgres`;
        
        console.log(`📡 Probing ${region} (${host})...`);
        const client = new pg.Client({ connectionString, connectionTimeoutMillis: 5000 });
        
        try {
            await client.connect();
            console.log(`✅ SUCCESS in ${region}!`);
            const res = await client.query('SELECT count(*) FROM public.profiles');
            console.log(`📊 Profiles: ${res.rows[0].count}`);
            await client.end();
            process.exit(0);
        } catch (err) {
            console.error(`❌ Failed in ${region}:`, err.message);
        }
    }
}

probe();
