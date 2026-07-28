const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const projectRef = 'ychwhxkxsxmuvabxlyjn';
const connectionString = `postgres://postgres.${projectRef}:mira-admin-2024@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`;

async function repairTrigger() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to DB via Pooler...');
        
        const sql = `
            -- 1. Create function
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
                    'specialist', -- Default role for this project
                    10,
                    'Novato',
                    false,
                    '["pioneiro"]'::jsonb
                )
                ON CONFLICT (id) DO NOTHING;

                RETURN NEW;
            END;
            $$;

            -- 2. Create trigger
            DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
            CREATE TRIGGER on_auth_user_created
                AFTER INSERT ON auth.users
                FOR EACH ROW
                EXECUTE FUNCTION public.handle_new_user();
                
            -- 3. Backfill missing profiles (SQL version)
            INSERT INTO public.profiles (id, email, username, full_name, role, reputation, trust_level)
            SELECT 
                u.id, 
                u.email, 
                LOWER(SPLIT_PART(u.email, '@', 1) || '_' || SUBSTRING(u.id::text, 1, 5)), 
                'Membro MIRA', 
                'specialist', 
                10, 
                'Novato'
            FROM auth.users u
            LEFT JOIN public.profiles p ON u.id = p.id
            WHERE p.id IS NULL
            ON CONFLICT (id) DO NOTHING;
        `;
        
        await client.query(sql);
        console.log('✅ TRIGGER REPAIRED AND BACKFILL COMPLETED!');
        
    } catch (err) {
        console.error('❌ FAILED TO REPAIR:', err.message);
        if (err.message.includes('authentication failed')) {
            console.log('Password might be incorrect.');
        }
    } finally {
        await client.end();
    }
}

repairTrigger();
