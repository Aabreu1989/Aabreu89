async function probeColumns() {
    const url = "https://ychwhxkxsxmuvabxlyjn.supabase.co/rest/v1/job_posts?select=*&limit=1";
    const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
    
    console.log("Probing job_posts columns on ychw...");
    try {
        const res = await fetch(url, {
            headers: {
                "apikey": key,
                "Authorization": `Bearer ${key}`
            }
        });
        console.log("Status:", res.status);
        const data = await res.json();
        if (data.length > 0) {
            console.log("Columns:", Object.keys(data[0]));
        } else {
            console.log("No data found to infer columns.");
        }
    } catch (e) {
        console.error("Probe failed:", e.message);
    }
}

probeColumns();
