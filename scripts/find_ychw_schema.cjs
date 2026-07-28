const pg = require('pg');

const projectRef = "ychwhxkxsxmuvabxlyjn";
const passwords = ["Britney", "mira-admin-2024", "Britney123%"];

async function findSchema() {
    for (const password of passwords) {
        // Try direct host first (IPv4 if possible, but let's try hostname)
        const host = `db.${projectRef}.supabase.co`;
        console.log(`📡 Trying password with ${host}...`);
        
        const client = new pg.Client({ 
            connectionString: `postgres://postgres:${password}@${host}:5432/postgres`,
            connectionTimeoutMillis: 5000
        });

        try {
            await client.connect();
            console.log("✅ SUCCESSFUL CONNECTION!");
            const res = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'job_posts'
                ORDER BY ordinal_position;
            `);
            console.log("Columns:");
            res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
            await client.end();
            return;
        } catch (err) {
            console.error(`❌ Failed with password:`, err.message);
        }
    }
}

findSchema();
