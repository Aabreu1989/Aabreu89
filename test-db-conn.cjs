const pg = require('pg');

async function tryConnect() {
    const projectRef = "pnlzyshozpqlzuyjesdq";
    const passwords = ["Amandas96068212", "Britney"];
    
    for (const password of passwords) {
        console.log(`Trying password: ${password}`);
        const connectionString = `postgres://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
        const client = new pg.Client({ connectionString });
        
        try {
            await client.connect();
            console.log("✅ SUCCESS with " + password);
            const res = await client.query('SELECT 1');
            console.log("Result:", res.rows);
            await client.end();
            return;
        } catch (e) {
            console.error("❌ Failed with " + password + ": " + e.message);
        }
    }
}

tryConnect();
