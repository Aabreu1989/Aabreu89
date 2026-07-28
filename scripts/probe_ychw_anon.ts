async function probe() {
    const url = "https://ychwhxkxsxmuvabxlyjn.supabase.co/rest/v1/profiles?select=count";
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaHdoeGt4c3htdXZhYnhseWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzc3OTgsImV4cCI6MjA4NzYxMzc5OH0.o3-cCO24KjNrW8NM7HFOycdpxX8D0q4vHeXS0BqFMGc";
    
    console.log("Probing ychw with ANON key...");
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
