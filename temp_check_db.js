
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { count: postCount, error: postErr } = await supabase.from('posts').select('*', { count: 'exact', head: true });
  const { count: commCount, error: commErr } = await supabase.from('comments').select('*', { count: 'exact', head: true });
  
  console.log('Posts:', postCount, postErr);
  console.log('Comments:', commCount, commErr);

  const { data: feed, error: feedErr } = await supabase.rpc('get_sovereign_community_feed_v24', { p_limit: 5, p_offset: 0 });
  console.log('Feed RPC:', feed?.length, feedErr);
}

check();
