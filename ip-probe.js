import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function probeIPs() {
    const urlStr = process.env.VITE_SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
    const ips = [`15.197.106.120`, `3.33.243.250` ];
    const user = `postgres.${urlStr}`; // Supabase requires this since it's a shared cluster

    for (const ip of ips) {
        console.log(`📡 Probing IP ${ip}:5432...`);
        const client = new pg.Client({ 
            connectionString: `postgres://${user}:mira-admin-2024@${ip}:5432/postgres`,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000
        });
        try {
            await client.connect();
            console.log(`✅ SUCCESS: Connected to IP ${ip}:5432`);
            await client.end();
            return;
        } catch (e) {
            console.log(`❌ FAILED IP ${ip}:5432: ${e.message}`);
        }
    }
}

probeIPs();
