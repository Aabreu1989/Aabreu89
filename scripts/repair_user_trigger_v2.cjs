const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const projectRef = 'ychwhxkxsxmuvabxlyjn';
const passwords = ['Britney', 'mira-admin-2024'];
const hosts = ['aws-0-eu-west-3.pooler.supabase.com', `db.${projectRef}.supabase.co` ];

async function repairTrigger() {
    for (const host of hosts) {
        for (const password of passwords) {
            const port = host.includes('pooler') ? 6543 : 5432;
            const user = host.includes('pooler') ? `postgres.${projectRef}` : 'postgres';
            const connectionString = `postgres://${user}:${password}@${host}:${port}/postgres`;
            
            console.log(`Trying connection to ${host} with user ${user}...`);
            const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
            
            try {
                await client.connect();
                console.log('✅ Connected!');
                
                const sql = `
                    CREATE OR REPLACE FUNCTION public.handle_new_user()
                    RETURNS trigger
                    LANGUAGE plpgsql
                    SECURITY DEFINER SET search_path = public
                    AS $$
                    BEGIN
                        INSERT INTO public.profiles (id, username, full_name, email, role, reputation, trust_level, is_muted, badges)
                        VALUES (
                            NEW.id,
                            LOWER(COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTRING(NEW.id::text, 1, 5))),
                            COALESCE(NEW.raw_user_meta_data->>'full_name', 'Membro MIRA'),
                            NEW.email,
                            'specialist',
                            10,
                            'Novato',
                            false,
                            '["pioneiro"]'::jsonb
                        )
                        ON CONFLICT (id) DO NOTHING;
                        RETURN NEW;
                    END;
                    $$;

                    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
                    CREATE TRIGGER on_auth_user_created
                        AFTER INSERT ON auth.users
                        FOR EACH ROW
                        EXECUTE FUNCTION public.handle_new_user();
                `;
                
                await client.query(sql);
                console.log('🚀 TRIGGER REPAIRED!');
                await client.end();
                return; // Stop after success
            } catch (err) {
                console.log(`❌ Failed: ${err.message}`);
                try { await client.end(); } catch(e){}
            }
        }
    }
}

repairTrigger();
