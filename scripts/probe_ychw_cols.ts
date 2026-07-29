async function probe() {
    const url = "https://ychwhxkxsxmuvabxlyjn.supabase.co/rest/v1/profiles?select=*&limit=1";
    const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
    
    console.log("Probing ychw profiles columns...");
    try {
        const res = await fetch(url, {
            headers: {
                "apikey": key,
                "Authorization": `Bearer ${key}`
            }
        });
        const data = await res.json();
        if (data.length > 0) {
            console.log("Columns in ychw profiles:", Object.keys(data[0]));
        } else {
            console.log("No data in ychw.");
        }
    } catch (e) {
        console.error("Probe failed:", e.message);
    }
}

probe();
