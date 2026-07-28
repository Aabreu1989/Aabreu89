const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    // We can't run raw SQL via supabase client unless we have a specific RPC.
    // But I can try to fetch a single record from posts and comments to see their columns.
    const { data: posts } = await supabase.from('posts').select('*').limit(1);
    const { data: comments } = await supabase.from('comments').select('*').limit(1);
    const { data: reports } = await supabase.from('reports').select('*').limit(1);

    if (posts && posts.length > 0) console.log("Posts Columns:", Object.keys(posts[0]));
    if (comments && comments.length > 0) console.log("Comments Columns:", Object.keys(comments[0]));
    if (reports && reports.length > 0) console.log("Reports Columns:", Object.keys(reports[0]));
    
    // If all are empty, I'll have to rely on common sense or find a way to run SQL.
}

check();
