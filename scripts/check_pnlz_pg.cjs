const pg = require('pg');

const projectRef = "pnlzyshozpqlzuyjesdq";
const password = "Britney";
const connectionString = `postgres://postgres.${projectRef}:${password}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;

async function checkSchema() {
    const client = new pg.Client({ connectionString });
    try {
        await client.connect();
        console.log("Connected to pnlz DB.");
        const res = await client.query(`SELECT count(*) FROM public.profiles`);
        console.log("Profiles count:", res.rows[0].count);
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

checkSchema();
