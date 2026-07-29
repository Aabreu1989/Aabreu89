async function probe() {
    const url = "https://pnlzyshozpqlzuyjesdq.supabase.co/rest/v1/profiles?select=count";
    const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
    
    console.log("Probing pnlz with Service Key...");
    try {
        const res = await fetch(url, {
            headers: {
                "apikey": key,
                "Authorization": `Bearer ${key}`
            }
        });
        console.log("Status:", res.status, res.statusText);
        const text = await res.text();
        console.log("Body:", text);
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

probe();
