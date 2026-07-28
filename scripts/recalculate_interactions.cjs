const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function recalculate() {
    console.log("🚀 MIRA Soberana: Recalculating All Interactions...");
    
    // 1. Fetch all posts
    const { data: posts, error: pErr } = await supabase.from('posts').select('id');
    if (pErr) { console.error(pErr); return; }
    
    console.log(`Found ${posts.length} posts. Syncing counts...`);
    
    for (const post of posts) {
        // Fetch real count from post_votes
        const { count: likes, error: lErr } = await supabase
            .from('post_votes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
            .eq('vote_type', 'like');
            
        const { count: useful, error: uErr } = await supabase
            .from('post_votes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
            .eq('vote_type', 'useful');
            
        const { count: fake, error: fErr } = await supabase
            .from('post_votes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
            .eq('vote_type', 'fake');

        if (lErr || uErr || fErr) {
            console.error(`Error counting for post ${post.id}`);
            continue;
        }

        // Update post table
        const { error: upErr } = await supabase
            .from('posts')
            .update({ 
                likes: likes || 0,
                useful_votes: useful || 0,
                fake_votes: fake || 0
            })
            .eq('id', post.id);
            
        if (upErr) {
            console.error(`Error updating post ${post.id}:`, upErr.message);
        } else {
            console.log(`✅ Post ${post.id}: Likes=${likes}, Useful=${useful}, Fake=${fake}`);
        }
    }
    
    console.log("✨ ALL COUNTS SYNCHRONIZED SUCCESSFULLY!");
}

recalculate();
