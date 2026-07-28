import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function probeDB() {
    const urlStr = process.env.VITE_SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
    const regions = ["eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "us-west-1", "us-west-2", "us-east-1"];
    const hosts = regions.map(r => `aws-0-${r}.pooler.supabase.com`);
    const ports = [6543, 5432];
    const users = [`postgres.${urlStr}`, `postgres` ];

    const passwords = ["mira-admin-2024", "Britney", "Amanda2026", "Abreu89"];
    for (const host of hosts) {
        for (const port of ports) {
            for (const user of users) {
                for (const pass of passwords) {
                    console.log(`📡 Probing ${user}@${host}:${port} with password: ${pass.substring(0,3)}...`);
                    const client = new pg.Client({ 
                        connectionString: `postgres://${user}:${pass}@${host}:${port}/postgres`,
                        ssl: { rejectUnauthorized: false },
                        connectionTimeoutMillis: 5000
                    });
                try {
                    await client.connect();
                    console.log(`✅ SUCCESS: Connected to ${user}@${host}:${port}`);
                    await client.end();
                    return;
                } catch (e) {
                    console.log(`❌ FAILED ${user}@${host}:${port}: ${e.message}`);
                } finally {
                    try { await client.end(); } catch(e) {}
                }
                }
            }
        }
    }
}

probeDB();
