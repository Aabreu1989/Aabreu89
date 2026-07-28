const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function checkCourses() {
    console.log("Checking courses table...");
    const { data, error } = await supabase.from('courses').select('*');
    if (error) {
        console.error("Error:", error);
        return;
    }
    console.log(`Found ${data.length} courses in DB.`);
    data.forEach(c => {
        console.log("---");
        console.log("ID:", c.id);
        console.log("Title:", c.title);
        console.log("Description Length:", c.description.length);
        console.log("Snippet:", c.description.substring(0, 150));
    });
}

checkCourses();
