const pg = require('pg');
const fs = require('fs');
const path = require('path');

const projectRef = "ychwhxkxsxmuvabxlyjn";
const password = "Britney";
const connectionString = `postgres://postgres:${password}@db.ychwhxkxsxmuvabxlyjn.supabase.co:5432/postgres`;

const vaultDir = path.join(__dirname, '../backups/RESCUE_VAULT');
if (!fs.existsSync(vaultDir)) fs.mkdirSync(vaultDir, { recursive: true });

async function exportData() {
    const client = new pg.Client({ connectionString });
    try {
        console.log("🔗 Connecting to NEW project via Postgres...");
        await client.connect();
        console.log("✅ Connected!");

        // 1. Export Profiles
        console.log("👤 Exporting Profiles...");
        const resProfiles = await client.query('SELECT * FROM public.profiles');
        fs.writeFileSync(path.join(vaultDir, 'users_ychw_backup.json'), JSON.stringify(resProfiles.rows, null, 2));
        console.log(`✅ Saved ${resProfiles.rows.length} profiles.`);

        // 2. Export Services
        console.log("🛠️ Exporting Services...");
        const resServices = await client.query('SELECT * FROM public.services');
        fs.writeFileSync(path.join(vaultDir, 'services_ychw_backup.json'), JSON.stringify(resServices.rows, null, 2));
        console.log(`✅ Saved ${resServices.rows.length} services.`);

        // 3. Export Jobs
        console.log("💼 Exporting Jobs...");
        const resJobs = await client.query('SELECT * FROM public.job_posts');
        fs.writeFileSync(path.join(vaultDir, 'jobs_ychw_backup.json'), JSON.stringify(resJobs.rows, null, 2));
        console.log(`✅ Saved ${resJobs.rows.length} jobs.`);

    } catch (err) {
        console.error("❌ Export failed:", err.message);
    } finally {
        await client.end();
    }
}

exportData();
