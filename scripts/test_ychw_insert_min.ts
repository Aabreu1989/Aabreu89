async function testInsert() {
    const url = "https://ychwhxkxsxmuvabxlyjn.supabase.co/rest/v1/job_posts";
    const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
    
    console.log("Testing minimal insert on ychw with ANON key...");
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "apikey": key,
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            },
            body: JSON.stringify({
                title: "Test Job Minimal"
            })
        });
        console.log("Status:", res.status, res.statusText);
        const text = await res.text();
        console.log("Body:", text);
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

testInsert();
