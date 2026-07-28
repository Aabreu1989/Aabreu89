const pg = require('pg');

const projectRef = "ychwhxkxsxmuvabxlyjn";
const password = "Britney";
const connectionString = `postgres://postgres.${projectRef}:${password}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;

async function checkSchema() {
    const client = new pg.Client({ connectionString });
    try {
        await client.connect();
        console.log("Connected to ychw DB.");
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'job_posts'
            ORDER BY ordinal_position;
        `);
        console.log("Columns in job_posts:");
        res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

checkSchema();
