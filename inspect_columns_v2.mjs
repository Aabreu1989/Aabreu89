import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectColumns(table) {
    console.log(`--- ${table.toUpperCase()} ---`);
    try {
        const { data, error } = await supabase.rpc('inspect_table_columns', { p_table_name: table });
        if (error) {
            // Fallback: try to select from information_schema
            const { data: cols, error: cError } = await supabase
                .from('information_schema.columns')
                .select('column_name')
                .eq('table_name', table)
                .eq('table_schema', 'public');
            
            if (cError || !cols) {
                console.log(`Error: ${cError?.message || 'Table not found'}`);
            } else {
                console.log(`Columns: ${cols.map(c => c.column_name).join(', ')}`);
            }
        } else {
            console.log(`Columns (RPC): ${data.map(c => c.column_name).join(', ')}`);
        }
    } catch (e) {
        console.error(e);
    }
}

const table = process.argv[2] || 'posts';
inspectColumns(table);
